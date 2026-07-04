# Integration Events — TreatmentProgram

Todos `final readonly` em `Modules\TreatmentProgram\Events`, despachados via `DB::afterCommit(fn () => Event::dispatch($event))` no Service (nunca no Controller). Carregam **apenas** IDs + snapshot mínimo — **nunca** Model Eloquent. `version = 1`. `occurredAt` = `CarbonImmutable`.

Os payloads de `TreatmentPlanActivated` e `TreatmentPlanCompleted` seguem exatamente o enunciado.

## TreatmentPlanCreated

```php
final readonly class TreatmentPlanCreated
{
    public function __construct(
        public int $version,
        public int $treatmentPlanId,
        public int $clinicId,
        public ?int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public string $status,
        public CarbonImmutable $occurredAt,
    ) {}
}
```
**Gatilho**: `TreatmentPlanService::create` (sempre), afterCommit.

## TreatmentPlanActivated

```php
final readonly class TreatmentPlanActivated
{
    public function __construct(
        public int $version,
        public int $treatmentPlanId,
        public int $clinicId,
        public int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public string $status,
        public ?string $startedAt,
        public CarbonImmutable $occurredAt,
    ) {}
}
```
**Gatilho**: `create` com `status=active` **ou** `update` que transiciona status → `active`. **Consumido por** `SendTreatmentPlanActivationNotification` (WhatsApp).

> Obs.: `patientId` é `int` (não-nulável) no payload; a notificação só faz sentido com paciente. Quando ativado sem `patient_id`, a ativação ocorre mas a notificação é no-op (o listener revalida). Emitir o evento apenas quando houver `patient_id` preserva o payload não-nulável e a condição atual do observer.

## TreatmentPlanCompleted

```php
final readonly class TreatmentPlanCompleted
{
    public function __construct(
        public int $version,
        public int $treatmentPlanId,
        public int $clinicId,
        public int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public string $status,
        public ?string $completedAt,
        public CarbonImmutable $occurredAt,
    ) {}
}
```
**Gatilho**: `update` que transiciona status → `completed`.

## TreatmentPlanArchived

```php
final readonly class TreatmentPlanArchived
{
    public function __construct(
        public int $version,
        public int $treatmentPlanId,
        public int $clinicId,
        public ?int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public string $status,          // 'cancelled'
        public CarbonImmutable $occurredAt,
    ) {}
}
```
**Gatilho**: `update` que transiciona status → `cancelled` (arquivamento/inativação).

## ProgramDraftCreated / ProgramDraftUpdated

```php
final readonly class ProgramDraftCreated // (idem ProgramDraftUpdated)
{
    public function __construct(
        public int $version,
        public int $programDraftId,
        public int $clinicId,
        public int $clinicUserId,
        public CarbonImmutable $occurredAt,
    ) {}
}
```
**Gatilho**: `ProgramDraftService::upsertForUser` — `Created` se `wasRecentlyCreated`, senão `Updated`.

## ProgramDraftConvertedToTreatmentPlan

```php
final readonly class ProgramDraftConvertedToTreatmentPlan
{
    public function __construct(
        public int $version,
        public int $programDraftId,
        public int $treatmentPlanId,
        public int $clinicId,
        public int $clinicUserId,
        public CarbonImmutable $occurredAt,
    ) {}
}
```
**Gatilho**: best-effort em `TreatmentPlanService::create` quando o ator (`clinic_user_id`) possui rascunho existente no momento da criação (sinal de conversão). Não altera nenhuma response. Sem rascunho → não emite.

---

## Fitness test de payload

Teste de arquitetura verifica que nenhuma propriedade dos 7 eventos é um `Illuminate\Database\Eloquent\Model` (apenas `int`, `?int`, `string`, `?string`, `CarbonImmutable`).

## Registro

Listeners registrados no `EventServiceProvider` do TreatmentProgram:

| Evento | Listener | Módulo do listener |
|--------|----------|--------------------|
| `TreatmentPlanActivated` | `SendTreatmentPlanActivationNotification` | TreatmentProgram |

Demais eventos ficam disponíveis para consumidores futuros (auditoria, relatórios) sem listener obrigatório nesta fase.
