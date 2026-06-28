# Integration Events Contract

4 eventos `final readonly` em `Modules\ClinicScheduling\Events`. Espelham o formato de `Modules\ClinicFinance\Events\FinancialTransactionRecorded`. Snapshot mínimo (IDs + primitivos + `CarbonImmutable`), **nunca** Model Eloquent. `version = 1`.

Dispatch (no `AppointmentService`):
```php
DB::afterCommit(fn () => Event::dispatch($event));
```

## AppointmentScheduled (use case: create)

```php
namespace Modules\ClinicScheduling\Events;

use Carbon\CarbonImmutable;

final readonly class AppointmentScheduled
{
    public function __construct(
        public int $version,
        public int $appointmentId,
        public int $clinicId,
        public ?int $patientId,
        public ?int $professionalId,
        public ?int $actorId,
        public string $startsAt,
        public string $endsAt,
        public string $status,
        public CarbonImmutable $occurredAt,
    ) {}
}
```

## AppointmentRescheduled (use case: update / qualquer PUT)

Mesmos campos de `AppointmentScheduled`. Disparado em **qualquer** update bem-sucedido (clarificação registrada na spec).

## AppointmentCancelled (use case: cancel → status cancelled)

Mesmos campos. `status = 'cancelled'`.

## AppointmentCompleted (use case: updateStatus → completed)

Mesmos campos. `status = 'completed'`.

> Campos: `professionalId = clinic_user_id`; `actorId = Auth::guard('clinic')->id()` no momento; `startsAt`/`endsAt` = ISO8601; `status` = `AppointmentStatus->value`; `occurredAt = CarbonImmutable::now()`.

## Consumidores (listeners)

| Listener | Módulo | Reage a | Ação |
|----------|--------|---------|------|
| `SyncSchedulingToGoogle` | GoogleCalendar | Scheduled, Rescheduled | `SyncAppointmentToGoogleJob` (upsert) se `clinicUser->isGoogleConnected()` |
| `SyncSchedulingToGoogle` | GoogleCalendar | Cancelled | `SyncAppointmentToGoogleJob` (delete) com `google_event_id` |
| `RecordSchedulingActivity` | Clinic | Scheduled, Completed, Cancelled | `ActivityLogger->log(...)` com o `ActivityType` correspondente |

Listeners são descobertos automaticamente (`$shouldDiscoverEvents = true` nos `EventServiceProvider` de cada módulo consumidor). Comportamento preservado: as mesmas ações (push/delete Google, log de atividade) ocorrem nas mesmas transições de antes.

## Fitness/behavior tests

- Unit: cada caso de uso despacha o evento esperado após commit, com snapshot mínimo e sem Model (espelha `FinancialTransactionEventsTest`).
- Boundary: `ClinicScheduling` não importa `Modules\GoogleCalendar\*` nem `Modules\Clinic\Contracts\ActivityLoggerInterface` em produção (dependência invertida).
