# Contract: Patient Programs REST

**Feature**: `015-patient-program-experience`  
**Base**: `/api/patient/programs`  
**Auth**:
- **Público (sem JWT, chave = `publicToken` UUID)**: detalhe, view, executions, series, unfinished, feedback, complete.
- **JWT guard `patient`**: só listagem (`GET /`).
**Isolation**:
- Detalhe público: resolve só por `public_token` de plano **não-draft** (não exige `patient_id` no request).
- Demais rotas: `patient_id` + `clinic_id` do JWT; `{publicToken}` = `clinic_treatment_plans.public_token` (UUID) do dono.

**Share URL (clínica — “Copiar o link”)**: `{app.url}/{clinicSlug}/paciente/programas/{publicToken}`  
**Abertura sem login (SPA)**: deep link `/{clinicSlug}/paciente/programas/{publicToken}` (detalhe público; API resolve clínica pelo token / `clinic_slug`)

Envelope de sucesso alinhado ao projeto: preferir `{ "data": … }` onde já for padrão patient/clinic.

Erros: `401` não autenticado (rotas autenticadas); `404` token inexistente / draft / (rotas auth) outro paciente / outra clínica; `422` validação; `409` opcional para estado inválido de execução (ou `422` com mensagem).

---

## GET `/api/patient/programs`

Lista programas elegíveis do paciente autenticado (exclui draft).

**Response `200`** — `data`: array de:

| Campo | Tipo | Notas |
|-------|------|--------|
| `public_token` | string | |
| `name` | string | `title` |
| `professional_name` | string | clinic user |
| `clinic_name` | string\|null | |
| `clinic_slug` | string\|null | slug para rotas SPA |
| `start_date` | date string\|null | ISO date |
| `end_date` | date string\|null | |
| `status` | enum | `available\|scheduled\|unavailable\|completed\|inactive` |
| `exercise_count` | int | |

---

## GET `/api/patient/programs/{publicToken}`

Detalhe completo. **Sem autenticação** (público por token).  
`current_execution` / `last_loads` só quando houver JWT do paciente dono; anônimo → `current_execution: null`.

**Response `200`** — `data`:

Além dos campos da lista:

| Campo | Tipo |
|-------|------|
| `message` | string\|null |
| `outcome_pain_enabled` | bool |
| `outcome_difficulty_enabled` | bool |
| `outcome_satisfaction_enabled` | bool |
| `groups` | array `{ id, name, exercises[] }` |
| `exercises[]` | ver abaixo |
| `current_execution` | object\|null | se `in_progress`: `{ id, unfinished_exercise_ids, last_loads }` |

**Exercise item**:

| Campo | Tipo |
|-------|------|
| `id` | string\|int | id do `treatment_plan_exercise` (FE trata como string) |
| `name` | string | do exercício catálogo |
| `video_url` | string\|null | |
| `thumbnail_url` | string\|null | |
| `notes` | string\|null | |
| `days` | string[] | from `days_of_week` |
| `period` | string[] | mapper: DB scalar → array |
| `prescription` | object | `series_min/max`, `repetitions_min/max`, `load_min/max`, `rest_time`, opcionais intensity/duration/maintain |

**`last_loads`**: map `exercise_id → { weight_value, weight_unit, is_bodyweight } | null`

---

## POST `/api/patient/programs/{publicToken}/view`

Registra visualização (idempotente: seta `patient_viewed_at` se null ou atualiza conforme regra — mínimo: set once).

**Response `200`**: `{ "data": { "viewed": true } }`  
Falha server → `5xx`; FE não bloqueia UX.

---

## POST `/api/patient/programs/{publicToken}/executions`

Inicia ou **retoma** execução `in_progress`.

**Pré-condição**: status paciente permite início (`available`; não `completed`/`inactive`/`scheduled`/`unavailable` conforme mapper).

**Response `200`/`201`**:

```json
{
  "data": {
    "id": 1,
    "status": "in_progress",
    "resumed": true,
    "unfinished_exercise_ids": [],
    "last_loads": {}
  }
}
```

---

## POST `/api/patient/programs/{publicToken}/executions/{executionId}/series`

Persiste séries de um exercício.

**Body**:

```json
{
  "exercise_id": 12,
  "series": [
    { "count": 12, "weight_value": "5", "weight_unit": "kg", "is_bodyweight": false }
  ]
}
```

`is_bodyweight: true` → ignora/ nullifica weight.

**Response `200`**: `{ "data": { "execution_id", "exercise_id", "series_count" } }`

---

## PATCH `/api/patient/programs/{publicToken}/executions/{executionId}`

Atualiza exercícios não finalizados.

**Body**: `{ "unfinished_exercise_ids": [1, 2] }`

**Response `200`**: execução atualizada.

---

## POST `/api/patient/programs/{publicToken}/feedback`

**Body** (campos conforme flags; dimensão desabilitada presente → `422`):

```json
{
  "pain": 3,
  "pain_notes": "optional",
  "difficulty": 4,
  "difficulty_notes": "optional",
  "rating": "Bom",
  "rating_notes": "optional",
  "execution_id": 1
}
```

Nota: FE usa `rating`; persistir como `satisfaction`. Escalas dor/dificuldade: **0–10**. Satisfação: enum PT-BR acima.

**Response `200`**: `{ "data": { "id", "submitted_at" } }` — **não** marca programa concluído.

---

## POST `/api/patient/programs/{publicToken}/complete`

Etapa separada. Incrementa `patient_completed_count` **uma vez** no ciclo; marca execução `completed` se houver.

**Idempotente**: se já concluído (v1: `patient_completed_count > 0`), `200` com `{ "data": { "already_completed": true, "patient_completed_count": N } }` sem novo incremento.

Se flags de outcome ligadas e não há feedback do ciclo → `422`.

**Response `200`** (primeira vez): `{ "data": { "already_completed": false, "patient_completed_count": N, "completed_at": "…" } }`

---

## FE mapping (snake → camel)

| API | Domain |
|-----|--------|
| `public_token` | `publicToken` |
| `professional_name` | `professionalName` |
| `outcome_*_enabled` | `outcome*Enabled` |
| `rating` / satisfaction | feedback `rating` |
| `rest_time` | `prescription.restTime` |

Mapper só em `infrastructure/`.
