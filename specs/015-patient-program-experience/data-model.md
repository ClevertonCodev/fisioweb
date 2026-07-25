# Data Model: Patient Program Experience

**Feature**: `015-patient-program-experience` | **Date**: 2026-07-25  
**Owner module**: `TreatmentProgram`

## Existing (reuse)

### TreatmentPlan (`clinic_treatment_plans`)

Campos relevantes já existentes: `id`, `clinic_id`, `patient_id`, `clinic_user_id`, `public_token`, `title`, `message`, `start_date`, `end_date`, `status` (`draft|active|completed|cancelled`), `patient_viewed_at`, `patient_completed_count`, relations `groups`, `exercises`, `clinicUser`, `clinic`.

### TreatmentPlanGroup / TreatmentPlanExercise

Prescrição e ordenação existentes (`sort_order`, sets/reps/load, `rest_time`, `days_of_week` JSON, `period` string, `notes`, `exercise_id` → mídia via exercício catálogo).

---

## Changes to TreatmentPlan

| Column | Type | Notes |
|--------|------|--------|
| `outcome_pain_enabled` | boolean, default `true` | FR-006 / FR-012 |
| `outcome_difficulty_enabled` | boolean, default `true` | |
| `outcome_satisfaction_enabled` | boolean, default `true` | |

Clinic UI para editar flags: **fora do escopo v1** (defaults + seed/update manual OK; clinic API edit pode vir depois).

---

## New: TreatmentPlanExecution (`clinic_treatment_plan_executions`)

| Column | Type | Notes |
|--------|------|--------|
| `id` | bigint PK | |
| `clinic_id` | FK/int | denormalizado para escopo tenant |
| `treatment_plan_id` | FK | |
| `patient_id` | FK/int | |
| `status` | string | `in_progress` \| `completed` \| `abandoned` (v1: abandoned opcional; resume usa `in_progress`) |
| `unfinished_exercise_ids` | JSON nullable | ids dos exercícios prescritos não feitos |
| `started_at` | datetime | |
| `completed_at` | datetime nullable | set no complete |
| `timestamps` | | |

**Constraints**:
- Unique parcial / enforcement em Service: no máximo **uma** row `status = in_progress` por (`treatment_plan_id`, `patient_id`).
- Indexes: `(patient_id, clinic_id)`, `(treatment_plan_id, patient_id, status)`, `(public lookup via plan.public_token)`.

**Transitions**:
```text
(none) --start--> in_progress --complete--> completed
in_progress --resume--> in_progress (same row)
```

---

## New: TreatmentPlanExecutionSeries (`clinic_treatment_plan_execution_series`)

| Column | Type | Notes |
|--------|------|--------|
| `id` | bigint PK | |
| `execution_id` | FK | |
| `treatment_plan_exercise_id` | FK | exercício prescrito |
| `series_index` | unsigned int | 1-based ordem da série |
| `count` | unsigned int nullable | repetições feitas |
| `weight_value` | string/decimal nullable | |
| `weight_unit` | string nullable | ex. `kg` |
| `is_bodyweight` | boolean default false | |
| `timestamps` | | |

**Validation**: exercício deve pertencer ao plan da execução; paciente dono.

**Last load**: última série (por `id`/`created_at` desc) do exercício na execução atual; senão em execuções `completed` anteriores do mesmo plan+patient.

---

## New: TreatmentPlanFeedback (`clinic_treatment_plan_feedbacks`)

| Column | Type | Notes |
|--------|------|--------|
| `id` | bigint PK | |
| `clinic_id` | int | |
| `treatment_plan_id` | FK | |
| `patient_id` | int | |
| `execution_id` | FK nullable | ciclo atual se houver |
| `pain` | unsigned tinyint nullable | escala 0–10 (default plano) |
| `pain_notes` | text nullable | |
| `difficulty` | unsigned tinyint nullable | 0–10 |
| `difficulty_notes` | text nullable | |
| `satisfaction` | string nullable | `Péssimo\|Ruim\|Médio\|Bom\|Ótimo` |
| `satisfaction_notes` | text nullable | |
| `submitted_at` | datetime | |
| `timestamps` | | |

**Validation (Service + FormRequest)**:
- Dimensão desabilitada no plan → rejeitar se campo/nota presente (FR-012a).
- Dimensão habilitada → valor obrigatório; notas opcionais (teto caracteres, ex. 2000).
- Não altera `patient_completed_count` nem status do plan.

---

## Derived: Patient-facing Program Status

Não persistido. Ver [research.md](./research.md) R3.

---

## Relationships (logical)

```text
TreatmentPlan 1──* TreatmentPlanGroup 1──* TreatmentPlanExercise
TreatmentPlan 1──* TreatmentPlanExecution 1──* TreatmentPlanExecutionSeries
TreatmentPlan 1──* TreatmentPlanFeedback
TreatmentPlanExecution 0..1──* TreatmentPlanFeedback
```

---

## Ownership & tenancy

- Todas as queries patient: `clinic_id = auth.clinic_id` AND `patient_id = auth.id` AND resolve plan by `public_token`.
- Cross-tenant / cross-patient → 404 (sem vazar existência).
- Escrita só em tabelas deste módulo; sem escrever em `patients` / `clinics`.
