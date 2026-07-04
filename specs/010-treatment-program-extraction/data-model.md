# Phase 1 — Data Model: Treatment Program

Entidades **movidas** de `Clinic` para `TreatmentProgram`. Nomes de tabela e colunas **inalterados**. Namespaces novos: `Modules\TreatmentProgram\Models\*`.

## Entidades

### TreatmentPlan — `clinic_treatment_plans`

Prescrição de exercícios de um paciente (ou modelo sem paciente) por uma clínica.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | bigint PK | |
| `clinic_id` | FK → `clinics` | ownership multi-tenant |
| `patient_id` | FK → `patients` nullable | nulo em modelo/rascunho sem paciente |
| `clinic_user_id` | FK → `clinic_users` nullable | profissional responsável |
| `title` | string(255) | obrigatório |
| `message` | string(600) nullable | usado na notificação WhatsApp |
| `physio_area_id` | FK → `admin_physio_areas` nullable | |
| `physio_subarea_id` | FK → `admin_physio_subareas` nullable | |
| `start_date` / `end_date` | date nullable | `end_date >= start_date` |
| `duration_minutes` | int nullable | |
| `status` | string(20) default `draft` | ver transições |
| `notes` | text nullable | |
| `patient_viewed_at` | datetime nullable | engajamento (migration de patient engagement) |
| `patient_completed_count` | int nullable | engajamento |

**Sem SoftDeletes** (delete = hard delete). Índice `['clinic_id','status']`.

**Relações** (FQN inline, ADR-008): `clinic` (Clinic), `clinicUser` (Clinic), `patient` (Patient), `physioArea`/`physioSubarea` (Admin), `groups` (HasMany, orderBy sort_order), `exercises` (HasMany, orderBy sort_order). Scope `forClinic($clinicId)`.

**Status / transições**:

```
draft ──▶ active ──▶ completed
  │          │
  └──────────┴──▶ cancelled   (= "arquivado")
```

| Const | Valor | Evento na entrada |
|-------|-------|-------------------|
| `STATUS_DRAFT` | `draft` | — |
| `STATUS_ACTIVE` | `active` | `TreatmentPlanActivated` (+ WhatsApp se paciente c/ telefone) |
| `STATUS_COMPLETED` | `completed` | `TreatmentPlanCompleted` |
| `STATUS_CANCELLED` | `cancelled` | `TreatmentPlanArchived` |

`create` sempre emite `TreatmentPlanCreated` (e `TreatmentPlanActivated` se nascer `active`).

---

### TreatmentPlanGroup — `clinic_treatment_plan_groups`

Agrupamento ordenado de exercícios dentro de um plano.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | bigint PK | |
| `treatment_plan_id` | FK → `clinic_treatment_plans` | cascade |
| `name` | string(255) | |
| `sort_order` | int | ordenação |

**Relações**: `treatmentPlan` (BelongsTo), `exercises` (HasMany via `treatment_plan_group_id`, orderBy sort_order).

---

### TreatmentPlanExercise — `clinic_treatment_plan_exercises`

Exercício do catálogo admin prescrito no plano, com parâmetros de prescrição.

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | bigint PK | |
| `treatment_plan_id` | FK → `clinic_treatment_plans` | |
| `treatment_plan_group_id` | FK nullable → groups | |
| `exercise_id` | FK → `admin_exercises` | catálogo Admin |
| `days_of_week` | json/array nullable | |
| `period` | string nullable | `PERIODS`: morning/afternoon/night |
| `sets_min`/`sets_max` | int nullable | defaults do catálogo Admin (via contrato) |
| `repetitions_min`/`repetitions_max` | int nullable | |
| `load_min`/`load_max` | numeric nullable | |
| `rest_time` | string(50) nullable | |
| `notes` | text nullable | |
| `sort_order` | int | |

**Relações** (FQN inline): `treatmentPlan`, `group` (`treatment_plan_group_id`), `exercise` (Admin `Exercise`).

**Regra**: defaults (`sets`, `repetitions`, `rest_time`) na criação vêm do catálogo Admin **via `ExerciseCatalogReadServiceInterface`** — não mais de `Exercise::findOrFail` no Service.

---

### ClinicProgramDraft — `clinic_program_drafts`

Rascunho de montagem de prescrição, 1 por usuário de clínica (autosave do assistente).

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | bigint PK | |
| `clinic_id` | FK → `clinics` | |
| `clinic_user_id` | FK → `clinic_users` | unicidade lógica (1 rascunho/usuário) |
| `draft_data` | json | `{ step, selectedIds[], groups[], savedAt }` |

**Relações** (FQN inline): `clinic`, `clinicUser`. Escopo sempre por `clinic_user_id` do ator (não há Policy; segurança por escopo de query).

---

## Integration Events (7)

Todos `final readonly`, em `Modules\TreatmentProgram\Events`, despachados via `DB::afterCommit`, carregando **apenas** IDs + snapshot mínimo (nunca Model). Campo `version` = 1. Ver [contracts/integration-events.md](contracts/integration-events.md) para payloads completos.

| Evento | Campos-chave |
|--------|--------------|
| `TreatmentPlanCreated` | version, treatmentPlanId, clinicId, patientId?, professionalId?, actorId?, status, occurredAt |
| `TreatmentPlanActivated` | version, treatmentPlanId, clinicId, patientId, professionalId?, actorId?, status, startedAt?, occurredAt |
| `TreatmentPlanCompleted` | version, treatmentPlanId, clinicId, patientId, professionalId?, actorId?, status, completedAt?, occurredAt |
| `TreatmentPlanArchived` | version, treatmentPlanId, clinicId, patientId?, professionalId?, actorId?, status, occurredAt |
| `ProgramDraftCreated` | version, programDraftId, clinicId, clinicUserId, occurredAt |
| `ProgramDraftUpdated` | version, programDraftId, clinicId, clinicUserId, occurredAt |
| `ProgramDraftConvertedToTreatmentPlan` | version, programDraftId, treatmentPlanId, clinicId, clinicUserId, occurredAt |

---

## Read Model público (dashboard)

`TreatmentProgramReadServiceInterface::activeProgramsCount(int $clinicId, ?int $clinicUserId, string $monthStart, string $monthEnd): int` — recebe datas `Y-m-d` e reproduz a query atual do dashboard (status `active`, paciente ativo, janela do mês). Ver [contracts/public-contracts.md](contracts/public-contracts.md).
