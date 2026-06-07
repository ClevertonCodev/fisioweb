# Queues / Jobs (fisioweb)

Padrão real do projeto, espelhando `modules/WhatsApp/app/Jobs/SendWhatsAppMessageJob.php` e o dispatch a partir de `TreatmentPlanObserver`.

## Job — estrutura base

```php
<?php

namespace Modules\<Module>\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Modules\<Module>\Contracts\<X>ServiceInterface;

class <Verb><Noun>Job implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;
    public array $backoff = [10, 30, 60]; // exponential

    public function __construct(
        public int $patientId,
        public string $message,
        public ?string $mediaUrl = null,
    ) {}

    public function handle(<X>ServiceInterface $service): void
    {
        if (!$service->isConfigured()) {
            logWarning('Job pulado — serviço não configurado.', [
                'patient_id' => $this->patientId,
            ]);
            return;
        }

        $result = $service->send($this->patientId, $this->message, $this->mediaUrl);

        logInfo('Job concluído.', [
            'patient_id' => $this->patientId,
            'result'     => $result['id'] ?? null,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        logError('Job falhou após retries.', [
            'patient_id' => $this->patientId,
            'message'    => $exception->getMessage(),
        ]);
    }
}
```

**Pontos críticos:**
- **Construtor só guarda dados primitivos** (string, int, id). Service vem por injeção no `handle()`.
- `public` nas props do construtor — `SerializesModels` precisa.
- `failed()` é chamado **após esgotar tries**. Use para logar e alertar.
- Helpers `logInfo`/`logWarning`/`logError` (definidos em `app/Helpers/utils.php`) — padrão do projeto, **não use `\Log::info` direto**.

## Passando Eloquent Model

Quando o Job recebe Model persistido, a trait `SerializesModels` serializa só `id` + classe e re-busca no `handle()`:

```php
public function __construct(public Patient $patient) {}

public function handle(): void
{
    // $this->patient é re-hidratado pelo worker
    $name = $this->patient->name;
}
```

**Cuidado:** se o Model for deletado entre dispatch e processamento, o job lança `ModelNotFoundException`. Use `try/catch` ou aceite o retry.

## Dispatch — formas

```php
use Modules\WhatsApp\Jobs\SendWhatsAppMessageJob;

// imediato (vai pra fila default)
SendWhatsAppMessageJob::dispatch(to: $phone, body: $msg);

// fila específica
SendWhatsAppMessageJob::dispatch(to: $phone, body: $msg)->onQueue('whatsapp');

// connection específica
SendWhatsAppMessageJob::dispatch(...)->onConnection('redis');

// atrasado
SendWhatsAppMessageJob::dispatch(...)->delay(now()->addMinutes(15));

// condicional
SendWhatsAppMessageJob::dispatchIf($patient->wantsNotifications, ...);
SendWhatsAppMessageJob::dispatchUnless($silentMode, ...);

// síncrono (útil em desenvolvimento, NÃO em produção)
SendWhatsAppMessageJob::dispatchSync(...);

// depois da resposta HTTP (não trava o request)
SendWhatsAppMessageJob::dispatchAfterResponse(...);
```

## `afterCommit()` — combine com transação

Sem isso, o Job pode rodar **antes** do commit e ler estado inexistente:

```php
DB::transaction(function () use ($data) {
    $plan = $this->repository->create($data);

    SendWhatsAppMessageJob::dispatch(
        to:   $plan->patient->phone,
        body: 'Seu plano está ativo',
    )->afterCommit();   // <-- crítico

    return $plan;
});
```

**Em Observer:** se o Observer escuta `created` e o create acontece dentro de uma transação maior (comum em Services), sempre `->afterCommit()`.

**Globalmente:** pode configurar a connection no `config/queue.php` com `'after_commit' => true` — então todo dispatch espera commit por padrão. Avaliar trade-off.

## Job único — evitar duplicação

Use quando "não pode haver dois jobs iguais pendentes". Ex.: lembrete diário por paciente.

```php
use Illuminate\Contracts\Queue\ShouldBeUnique;

class SendDailyReminderJob implements ShouldQueue, ShouldBeUnique
{
    public int $uniqueFor = 3600; // chave dura 1h

    public function __construct(public int $patientId) {}

    public function uniqueId(): string
    {
        return "reminder:{$this->patientId}";
    }

    public function handle(): void { /* ... */ }
}
```

Outra variante: `ShouldBeUniqueUntilProcessing` — libera a chave quando o job começa a executar (permite enfileirar próximo enquanto o atual roda).

## Job middleware — rate limit, sem sobreposição

### Sem overlap (uma execução por chave)

```php
use Illuminate\Queue\Middleware\WithoutOverlapping;

public function middleware(): array
{
    return [
        (new WithoutOverlapping($this->patientId))->expireAfter(180),
    ];
}
```

### Rate limit (Redis)

```php
use Illuminate\Queue\Middleware\RateLimited;

public function middleware(): array
{
    return [new RateLimited('whatsapp-api')];
}
```

Definir o limiter em `AppServiceProvider::boot()`:

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('whatsapp-api', fn () => Limit::perMinute(60));
```

## Chains — sequência

```php
use Illuminate\Support\Facades\Bus;

Bus::chain([
    new GenerateReportPdfJob($reportId),
    new UploadToR2Job($reportId),
    new NotifyClinicAdminJob($reportId),
])->catch(function (\Throwable $e) use ($reportId) {
    logError('Chain falhou', ['report_id' => $reportId, 'error' => $e->getMessage()]);
})->dispatch();
```

Se um job falhar, os seguintes **não** rodam.

## Batches — processamento paralelo

```php
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;

$batch = Bus::batch(
    Patient::active()->get()->map(
        fn (Patient $p) => new SendMonthlyReportJob($p->id)
    )->all()
)
->name('relatorio-mensal-' . now()->format('Y-m'))
->allowFailures()
->then(fn (Batch $batch) => logInfo('Batch ok', ['name' => $batch->name]))
->catch(fn (Batch $batch, \Throwable $e) => logError('Batch falhou', [
    'name' => $batch->name, 'error' => $e->getMessage(),
]))
->dispatch();
```

Pré-requisito: `php artisan queue:batches-table` + migration rodada.

## Failed jobs — operação

```bash
# tabela criada uma vez
php artisan queue:failed-table && php artisan migrate

# listar falhos
php artisan queue:failed

# retentar um
php artisan queue:retry <uuid>

# retentar todos
php artisan queue:retry all

# limpar
php artisan queue:flush

# remover antigos
php artisan queue:prune-failed --hours=72
```

## Workers — comandos

```bash
# desenvolvimento (composer run dev já inclui um listener)
php artisan queue:work

# múltiplas filas com prioridade
php artisan queue:work --queue=critical,whatsapp,default

# uma só
php artisan queue:work --once

# pôr workers para reiniciar (deploy)
php artisan queue:restart

# limites
php artisan queue:work --timeout=60 --memory=512 --max-jobs=1000 --max-time=3600
```

Em produção: supervisor (systemd ou supervisord) rodando `queue:work` com restart automático.

## Disparar Job de Observer

Padrão real (`TreatmentPlanObserver`):

```php
public function updated(TreatmentPlan $plan): void
{
    $justActivated = $plan->wasChanged('status')
        && $plan->status === TreatmentPlan::STATUS_ACTIVE;

    if (!$justActivated) {
        return;
    }

    $plan->loadMissing('patient');

    if (!$plan->patient?->phone) {
        return;
    }

    SendWhatsAppMessageJob::dispatch(
        to:   $plan->patient->phone,
        body: $plan->message ?: 'Seu plano de tratamento está ativo.',
    );
}
```

**Sempre `loadMissing`** antes de acessar relacionamento no Observer — model pode vir sem eager loading.

## Testes — `Queue::fake()`

Não rodar o job de verdade. Asserções de dispatch:

```php
<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Patient;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\WhatsApp\Jobs\SendWhatsAppMessageJob;
use Tests\TestCase;

class TreatmentPlanActivationTest extends TestCase
{
    use RefreshDatabase;

    public function test_activating_plan_dispatches_whatsapp_job(): void
    {
        Queue::fake();

        $patient = Patient::factory()->create(['phone' => '11999999999']);
        $plan    = TreatmentPlan::factory()->for($patient)->create([
            'status' => TreatmentPlan::STATUS_DRAFT,
        ]);

        $plan->update(['status' => TreatmentPlan::STATUS_ACTIVE]);

        Queue::assertPushed(SendWhatsAppMessageJob::class);
        Queue::assertPushed(SendWhatsAppMessageJob::class, fn ($job) =>
            $job->to === '11999999999'
        );
    }

    public function test_inactive_plan_does_not_dispatch_job(): void
    {
        Queue::fake();

        Patient::factory()->create();
        TreatmentPlan::factory()->create([
            'status' => TreatmentPlan::STATUS_DRAFT,
        ]);

        Queue::assertNothingPushed();
    }

    public function test_specific_job_count(): void
    {
        Queue::fake();

        // disparar 3
        SendWhatsAppMessageJob::dispatch(to: '1', body: 'a');
        SendWhatsAppMessageJob::dispatch(to: '2', body: 'b');
        SendWhatsAppMessageJob::dispatch(to: '3', body: 'c');

        Queue::assertPushed(SendWhatsAppMessageJob::class, 3);
    }
}
```

### Testar o `handle()` em isolamento (Unit)

Não use `Queue::fake()` — instancie o Job direto:

```php
public function test_handle_skips_when_service_not_configured(): void
{
    $service = $this->createMock(WhatsAppServiceInterface::class);
    $service->method('isConfigured')->willReturn(false);
    $service->expects($this->never())->method('send');

    $job = new SendWhatsAppMessageJob(to: '11999', body: 'msg');
    $job->handle($service);

    // sucesso = método send NÃO foi chamado
    $this->assertTrue(true);
}

public function test_handle_calls_service_when_configured(): void
{
    $service = $this->createMock(WhatsAppServiceInterface::class);
    $service->method('isConfigured')->willReturn(true);
    $service->expects($this->once())
        ->method('send')
        ->with('11999', 'msg', null)
        ->willReturn(['sid' => 'abc', 'status' => 'queued']);

    $job = new SendWhatsAppMessageJob(to: '11999', body: 'msg');
    $job->handle($service);
}
```

## Best practices — checklist

1. **Job pequeno e focado** — um job = uma responsabilidade.
2. **Idempotente** — rodar duas vezes não deve corromper estado.
3. **Tipos no construtor** — primitivos ou Models, nada de Service.
4. **`$tries` + `$backoff`** sempre definidos.
5. **`failed()`** sempre implementado com `logError`.
6. **`afterCommit()`** quando dispatch dentro de `DB::transaction` ou Observer.
7. **Job único** quando duplicação seria erro.
8. **Rate limit / sem overlap** para APIs externas.
9. **Testar dispatch** com `Queue::fake()`, testar `handle()` isolado com mock.
10. **Helpers do projeto** (`logInfo`, etc.) em vez de `\Log::`.
