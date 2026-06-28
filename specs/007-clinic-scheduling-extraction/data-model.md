# Phase 1 — Data Model: Clinic Scheduling

## Entidade: Appointment

Tabela `clinic_appointments` (**nome inalterado**). Schema preservado da migration atual.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | bigint PK | |
| `clinic_id` | FK → `clinics` | cascadeOnDelete |
| `patient_id` | FK → `patients`, nullable | nullOnDelete |
| `clinic_user_id` | FK → `clinic_users` | cascadeOnDelete; profissional responsável |
| `title` | string nullable | |
| `description` | text nullable | |
| `location` | string nullable | |
| `starts_at` | timestamp | cast `datetime` |
| `ends_at` | timestamp | cast `datetime` |
| `status` | string(20), default `scheduled` | cast `AppointmentStatus` |
| `google_event_id` | string nullable | integração GoogleCalendar |
| `source` | string(20), default `system` | `system` \| `google` |
| `last_synced_at` | timestamp nullable | cast `datetime` |
| `created_at` / `updated_at` | timestamps | |

Índices preservados: `(clinic_id, starts_at)`, `(clinic_user_id, starts_at)`, `(clinic_id, status)`, `google_event_id`.

**Constantes**: `SOURCE_SYSTEM='system'`, `SOURCE_GOOGLE='google'`.

**Relações** (FQN inline — ver research R2):

- `clinic()` → `\Modules\Clinic\Models\Clinic`
- `clinicUser()` → `\Modules\Clinic\Models\ClinicUser`
- `patient()` → `\Modules\Patient\Models\Patient`

**Scopes preservados**: `forClinic($clinicId)`, `forClinicUser($clinicUserId)`.

**Namespace novo**: `Modules\ClinicScheduling\Models\Appointment`. Factory: `Modules\ClinicScheduling\Database\Factories\AppointmentFactory`.

## Value Object: AppointmentStatus (enum)

`Modules\ClinicScheduling\Enums\AppointmentStatus: string` — **conteúdo inalterado**.

Casos: `Scheduled=scheduled`, `Confirmed=confirmed`, `NoShow=no_show`, `Completed=completed`, `Cancelled=cancelled`.

Métodos preservados: `label()`, `color()`, `isTerminal()`, `canTransitionTo(self $to, Carbon $startsAt, Carbon $now): bool`.

### Transições de status (regra preservada — FR-004)

```
scheduled → confirmed | cancelled | no_show* | completed*
confirmed → cancelled | no_show* | completed*
no_show, completed, cancelled → (terminal, sem saída)
(*) no_show e completed só após starts_at
```

## Eventos de integração

Todos `final readonly` em `Modules\ClinicScheduling\Events`, despachados via `DB::afterCommit`. Snapshot mínimo, sem Model. `version=1` inicial. Detalhe completo em [contracts/integration-events.md](contracts/integration-events.md).

| Evento | Disparado em | Campos (além de version, occurredAt) |
|--------|--------------|--------------------------------------|
| `AppointmentScheduled` | `create` | appointmentId, clinicId, patientId?, professionalId?, actorId?, startsAt, endsAt, status |
| `AppointmentRescheduled` | qualquer `update`/PUT | idem |
| `AppointmentCancelled` | `cancel` (status→cancelled) | idem |
| `AppointmentCompleted` | `updateStatus` status→completed | idem |

Mapeamento de nomes: `professionalId` = `clinic_user_id`; `actorId` = `Auth::guard('clinic')->id()` no momento do caso de uso; `startsAt`/`endsAt` = ISO8601 string; `status` = `AppointmentStatus->value`.

## Read DTOs (contrato público para Dashboard/Occupancy)

Servidos por `SchedulingReadServiceInterface` (ver [contracts/public-contracts.md](contracts/public-contracts.md)). Formas (arrays) preservando o shape consumido hoje:

**upcomingAppointmentsToday** → lista de:
```
{ id, patient_name, patient_photo_url, title, starts_at (ISO8601), status (string) }
```

**occupancyIntervals** → lista de:
```
{ starts_at: Carbon, ends_at: Carbon }
```

**appointmentsTodayCount** → `int`.

## Atores e papéis (regras de visibilidade/autorização preservadas)

- **Fisioterapeuta** (`isPhysiotherapist`): vê/gerencia apenas as próprias consultas; ao criar/atualizar, `clinic_user_id` é forçado ao próprio id (defesa em profundidade no FormRequest).
- **Admin/Secretário** (`isAdmin`/`isSecretary`): gerenciam toda a agenda da clínica.
- **Isolamento multi-tenant**: registro de outra clínica → 404 (checagem em controller + Policy por `clinic_id`).
