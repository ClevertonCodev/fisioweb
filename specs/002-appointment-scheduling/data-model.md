# Phase 1 — Data Model

Feature: Agendamento de Consultas com Google Calendar

## Entidade nova: `clinic_appointments` (Appointment)

Tabela nova (migration `create_clinic_appointments_table`). Prefixo `clinic_` por convenção.

| Coluna | Tipo | Nullable | Notas |
|--------|------|----------|-------|
| `id` | bigint PK | não | |
| `clinic_id` | FK → `clinics` | não | cascadeOnDelete; multi-tenant (FR-021) |
| `patient_id` | FK → `patients` | sim | nullable p/ evento externo do Google sem paciente (FR-016 edge) |
| `clinic_user_id` | FK → `clinic_users` | não | fisioterapeuta responsável |
| `title` | string | sim | |
| `description` | text | sim | observações |
| `location` | string | sim | local/sala |
| `starts_at` | timestamp (UTC) | não | FR-025 |
| `ends_at` | timestamp (UTC) | não | FR-025; > starts_at (FR-003) |
| `status` | string(20) | não | enum AppointmentStatus; default `scheduled` (FR-004) |
| `google_event_id` | string | sim | correlação/deduplicação (FR-017) |
| `source` | string(20) | não | `system` \| `google` (origem; evita loop push↔pull) default `system` |
| `last_synced_at` | timestamp | sim | última sync com Google |
| `created_at`/`updated_at` | timestamps | | |

Índices: `['clinic_id','starts_at']`, `['clinic_user_id','starts_at']`, `['clinic_id','status']`, índice/unique parcial em `google_event_id`.

**Relacionamentos** (Eloquent):
- `belongsTo(Clinic)`, `belongsTo(Patient)`, `belongsTo(ClinicUser, 'clinic_user_id')`.
- `ClinicUser hasMany(Appointment, 'clinic_user_id')`.

**Casts**: `starts_at`/`ends_at`/`last_synced_at` → `datetime`; `status` → `AppointmentStatus` (enum cast).

**Regras de validação** (Request + Service):
- `patient_id` obrigatório na criação via UI; pertence à `clinic_id` do usuário (FR-012).
- `clinic_user_id` pertence à clínica e é fisioterapeuta; se autor for fisioterapeuta, forçado a si mesmo (FR-010).
- `ends_at > starts_at` (FR-003).
- `status` segue máquina de transições (FR-023).

## Entidade estendida: `clinic_users` (colunas Google — editar migration existente)

| Coluna | Tipo | Nullable | Notas |
|--------|------|----------|-------|
| `google_access_token` | text | sim | criptografar (cast `encrypted`) |
| `google_refresh_token` | text | sim | criptografar |
| `google_token_expires_at` | timestamp | sim | |
| `google_calendar_id` | string | sim | calendário-alvo (default `primary`) |
| `google_sync_token` | text | sim | token incremental do polling (FR-016) |
| `google_connected_at` | timestamp | sim | null = não conectado (FR-018) |

`ClinicUser`: accessor `isGoogleConnected(): bool` (= `google_connected_at !== null`). Casts `encrypted` nos tokens; estes campos em `$hidden`.

## Enum: `AppointmentStatus` (PHP)

Valores e cores espelham `STATUS_COLORS` do frontend (`domain/clinic/appointment.ts`):

| Valor | Label | Cor (bg) | Terminal? |
|-------|-------|----------|-----------|
| `scheduled` | Agendada | #3b82f6 | não |
| `confirmed` | Confirmada | #22c55e | não |
| `no_show` | Não compareceu | #f59e0b | sim |
| `completed` | Concluída | #6b7280 | sim |
| `cancelled` | Cancelada | #ef4444 | sim |

### Transições válidas (FR-023)

```
scheduled → confirmed | cancelled | no_show* | completed*
confirmed → cancelled | no_show* | completed*
no_show   → (terminal)
completed → (terminal)
cancelled → (terminal — não volta para scheduled/confirmed)
```
`*` `no_show` e `completed` só permitidos quando `now() >= starts_at`.

Método `canTransitionTo(self $to, Carbon $startsAt, Carbon $now): bool`.

## Notificação de agendamento (sem persistência nova)

Evento/Job enfileirado (`AppointmentScheduledNotification` ou evento de domínio) carregando `appointment_id`, destinatários (fisioterapeuta + paciente). Entrega de canal fora de escopo (FR-020) — apenas dispara/enfileira.

## Frontend — `domain/clinic/appointment.ts` (ajuste)

- Remover `sendCalendarInvite` (desconsiderado).
- Manter `AppointmentStatus`, `Appointment`, `CalendarEvent`, `STATUS_COLORS`.
- DTOs de escrita ficam em `application/clinic/ports.ts` (camelCase): `AppointmentWriteDto` (patientId, clinicUserId, title?, description?, location?, startsAt, endsAt), `AppointmentUpdateDto`, `AppointmentStatusUpdateDto { status }`.
