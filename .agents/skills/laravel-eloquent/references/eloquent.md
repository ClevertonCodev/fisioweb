# Eloquent (fisioweb)

Padrões reais do projeto. Todos os exemplos usam entidades existentes (`Exercise`, `Patient`, `TreatmentPlan`, `Feature`, `AdminProgram`) e namespaces `Modules\<Module>\`.

## Model — estrutura base

Espelha `modules/Admin/app/Models/Exercise.php`.

```php
<?php

namespace Modules\<Module>\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class <Entity> extends Model
{
    use SoftDeletes; // só se houver coluna deleted_at

    protected $fillable = [
        'name',
        'description',
        'is_active',
        // ... todas as colunas writeable
    ];

    // forma moderna (Laravel 11+) — método, não propriedade
    protected function casts(): array
    {
        return [
            'is_active'  => 'boolean',
            'metadata'   => 'array',
            'started_at' => 'datetime',
            'status'     => PatientStatus::class, // Enum
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TreatmentSession::class);
    }
}
```

**Por que método em vez de `$casts` propriedade:** permite usar `Enum::class`, classes dinâmicas e referenciar tipos importados sem ordenamento de carga de classes.

## Relacionamentos

### BelongsTo / HasMany

```php
class TreatmentPlan extends Model
{
    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(TreatmentSession::class)->orderBy('scheduled_at');
    }
}
```

### BelongsToMany com pivot

Padrão real em `Exercise::videos()`:

```php
public function videos(): BelongsToMany
{
    return $this->belongsToMany(Video::class, 'exercise_video')
        ->withTimestamps();
}
```

Com pivot custom:

```php
public function exercises(): BelongsToMany
{
    return $this->belongsToMany(Exercise::class, 'program_exercises')
        ->withPivot(['order', 'sets', 'repetitions'])
        ->withTimestamps();
}
```

### HasOne ordenado (latest/oldest of many)

```php
class Patient extends Model
{
    public function latestPlan(): HasOne
    {
        return $this->hasOne(TreatmentPlan::class)->latestOfMany();
    }
}
```

## Scopes locais (reutilizar filtro)

Padrão dominante no projeto. Já usado em `Exercise`, `AdminAssessmentTemplate`, `AdminProgram`, `BodyRegion`, `PatientFile`.

```php
class Exercise extends Model
{
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}

class PatientFile extends Model
{
    public function scopeForClinic($query, int $clinicId)
    {
        return $query->where('clinic_id', $clinicId);
    }

    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}
```

**Uso (no Repository, não no Controller):**

```php
return $this->model
    ->forClinic($clinicId)
    ->active()
    ->latest()
    ->paginate($perPage);
```

## Global Scope (cuidado)

Use só quando o filtro é **invariante** em todas as queries — ex.: "nunca mostrar registros de tenant errado". No fisioweb hoje não há global scope; o filtro de clínica/usuário é explícito via `scopeForClinic`. Prefira essa abordagem.

Se realmente precisar:

```php
class TreatmentSession extends Model
{
    protected static function booted(): void
    {
        static::addGlobalScope('not_archived', function ($query) {
            $query->where('is_archived', false);
        });
    }
}
```

Para escapar do scope pontualmente: `TreatmentSession::withoutGlobalScope('not_archived')->get()`.

## Accessor / Mutator com `Attribute` (sintaxe nova)

Não está no projeto hoje. Use em Model novo quando precisar transformar leitura/escrita de uma coluna específica.

```php
use Illuminate\Database\Eloquent\Casts\Attribute;

class Patient extends Model
{
    // accessor — formata nome ao ler
    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (string $value) => mb_convert_case($value, MB_CASE_TITLE, 'UTF-8'),
        );
    }

    // mutator — normaliza telefone ao escrever
    protected function phone(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value) => $value ? preg_replace('/\D/', '', $value) : null,
        );
    }

    // virtual attribute — não persiste, só serializa
    protected function fullAddress(): Attribute
    {
        return Attribute::make(
            get: fn () => trim("{$this->street}, {$this->number} - {$this->city}"),
        );
    }
}
```

**Não use accessor para localização (label PT)** — isso é responsabilidade do frontend ou de um método `label()` no Enum.

## Custom Cast — Value Object ↔ coluna

Quando o domínio tem Value Object e a coluna é primitiva:

```php
<?php

namespace Modules\<Module>\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;
use Modules\<Module>\ValueObjects\SessionDuration;

class SessionDurationCast implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes): ?SessionDuration
    {
        return $value === null ? null : new SessionDuration((int) $value);
    }

    public function set($model, string $key, $value, array $attributes): ?int
    {
        if ($value === null) {
            return null;
        }

        if (!$value instanceof SessionDuration) {
            throw new \InvalidArgumentException('Esperado SessionDuration');
        }

        return $value->seconds;
    }
}
```

No Model:

```php
protected function casts(): array
{
    return [
        'duration' => SessionDurationCast::class,
    ];
}
```

## Eager loading — prevenir N+1

**Responsabilidade do Repository.** Controller nunca chama `with()`.

```php
public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
{
    $query = $this->model->with([
        'patient',
        'sessions' => fn ($q) => $q->where('status', 'pending')->orderBy('scheduled_at'),
        'physio',
    ]);

    // filtros...

    return $query->latest()->paginate($perPage)->withQueryString();
}
```

### Contagem de relacionamento

```php
$plans = TreatmentPlan::withCount('sessions')->get();
// $plan->sessions_count está populado, sem carregar as sessions
```

### Existência sem carregar

```php
$patients = Patient::withExists('latestPlan')->get();
// $patient->latest_plan_exists (boolean)
```

### Lazy eager loading (depois de carregar)

```php
$plans = TreatmentPlan::all();
$plans->load('sessions');  // carrega em lote, 1 query
```

## Datasets grandes — `chunk` e `lazy`

Use em Artisan command, Job, ou seeder. **Nunca** em request HTTP.

```php
// chunk: divide em blocos
Patient::active()->chunk(200, function ($patients) {
    foreach ($patients as $patient) {
        // processar
    }
});

// lazy: memória mínima, item por item
Patient::active()->lazy()->each(function (Patient $patient) {
    SendReminderJob::dispatch($patient);
});
```

## Queries condicionais — `when()`

Substitui `if/else` no builder do Repository.

```php
public function paginate(array $filters, int $perPage): LengthAwarePaginator
{
    return $this->model
        ->when($filters['search'] ?? null, fn ($q, $search) =>
            $q->where(fn ($w) =>
                $w->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
            )
        )
        ->when($filters['clinic_id'] ?? null, fn ($q, $clinicId) =>
            $q->where('clinic_id', $clinicId)
        )
        ->when(array_key_exists('is_active', $filters), fn ($q) =>
            $q->where('is_active', $filters['is_active'])
        )
        ->latest()
        ->paginate($perPage);
}
```

Limpa, sem encadeamento de `if`.

## Subquery — coluna calculada sem JOIN

```php
$clinics = Clinic::select(['id', 'name'])
    ->addSelect(['last_session_at' =>
        TreatmentSession::select('created_at')
            ->whereColumn('clinic_id', 'clinics.id')
            ->latest()
            ->limit(1),
    ])
    ->get();

// $clinic->last_session_at populado por subquery
```

## Transações — `DB::transaction`

Padrão real em `AdminProgramService::create`:

```php
public function create(array $data): AdminProgram
{
    return DB::transaction(function () use ($data) {
        $groups    = $data['groups']    ?? [];
        $exercises = $data['exercises'] ?? [];

        $program = $this->repository->create($data);

        foreach ($groups as $group) {
            $program->groups()->create($group);
        }

        foreach ($exercises as $exercise) {
            $program->programExercises()->create($exercise);
        }

        return $program->fresh(['groups', 'programExercises']);
    });
}
```

**Combine com Jobs via `afterCommit()`** (ver [`laravel-queues`](../laravel-queues/SKILL.md)) — dispatch dentro de transação pode rodar antes do commit.

## Observers — reagir a eventos de Model

Padrão real em `modules/Clinic/app/Observers/TreatmentPlanObserver.php`. Dispara `SendWhatsAppMessageJob` quando o plano fica ativo.

### Criando

```php
<?php

namespace Modules\<Module>\Observers;

use Modules\<Module>\Models\TreatmentSession;
use Modules\WhatsApp\Jobs\SendWhatsAppMessageJob;

class TreatmentSessionObserver
{
    public function creating(TreatmentSession $session): void
    {
        // mutações no model ANTES de salvar
        $session->reference = $session->reference ?? str()->upper(str()->random(8));
    }

    public function created(TreatmentSession $session): void
    {
        // ação DEPOIS de salvar
        $session->loadMissing('patient');
        SendWhatsAppMessageJob::dispatch(
            to:   $session->patient->phone,
            body: "Sessão agendada para {$session->scheduled_at->format('d/m H:i')}",
        );
    }

    public function updated(TreatmentSession $session): void
    {
        if ($session->wasChanged('status') && $session->status === 'cancelled') {
            // notificar cancelamento
        }
    }

    public function deleted(TreatmentSession $session): void
    {
        $session->reminders()->delete();
    }
}
```

### Registrando

Em `modules/<Module>/app/Providers/<Module>ServiceProvider.php`, dentro de `boot()`:

```php
use Modules\<Module>\Models\TreatmentSession;
use Modules\<Module>\Observers\TreatmentSessionObserver;

public function boot(): void
{
    // ...
    TreatmentSession::observe(TreatmentSessionObserver::class);
}
```

### Eventos disponíveis

| Evento | Quando |
|--------|--------|
| `retrieved` | Após buscar do DB |
| `creating` / `created` | Antes/depois de insert |
| `updating` / `updated` | Antes/depois de update |
| `saving` / `saved` | Antes/depois de qualquer persistência |
| `deleting` / `deleted` | Antes/depois de delete |
| `restoring` / `restored` | Soft delete restaurado |
| `forceDeleted` | Hard delete em model com SoftDeletes |

### Padrão `wasChanged` / `wasRecentlyCreated`

Real do `TreatmentPlanObserver`:

```php
public function updated(TreatmentPlan $plan): void
{
    $statusJustActivated = $plan->wasChanged('status')
        && $plan->status === TreatmentPlan::STATUS_ACTIVE;

    if ($statusJustActivated) {
        // disparar ação
    }
}
```

Permite agir só quando uma coluna específica mudou, sem refazer queries.

## Pessimistic locking (race condition)

Para fluxos que precisam serializar acesso (ex.: incrementar contador de uso de feature por clínica):

```php
DB::transaction(function () use ($clinicId) {
    $usage = FeatureUsage::where('clinic_id', $clinicId)
        ->where('feature_key', 'patient_count')
        ->lockForUpdate()
        ->first();

    $usage->increment('count');
});
```

`lockForUpdate()` segura a row até o commit. Use só dentro de `DB::transaction`.

## Upsert — insert + update em lote

Quando importar planilha ou sincronizar com sistema externo:

```php
Patient::upsert(
    [
        ['cpf' => '11111111111', 'name' => 'João', 'clinic_id' => 1],
        ['cpf' => '22222222222', 'name' => 'Maria', 'clinic_id' => 1],
    ],
    ['cpf'],            // chaves únicas
    ['name'],           // colunas a atualizar em conflito
);
```

## Performance — checklist rápido

1. **Eager load no Repository**, nunca lazy loading em loop.
2. **`withCount` para contadores**, evita carregar relação inteira.
3. **`chunk`/`lazy` em jobs e seeders**, nunca em request HTTP.
4. **`select(['col1', 'col2'])`** quando não precisar de todas as colunas.
5. **Índice em FK e colunas filtradas** na migration.
6. **`DB::transaction`** para integridade cross-table.
7. **Cache pesado em Redis** com `Cache::remember(key, ttl, fn)`.
8. **Não use Observer para operação pesada** — dispatch Job (ver [`laravel-queues`](../laravel-queues/SKILL.md)).
