# Phase 1 — Data Model: Clinical Record

## Assessment (`clinic_assessments`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | bigint PK | |
| `clinic_id` | FK → `clinics` | cascadeOnDelete |
| `patient_id` | FK → `patients` | cascadeOnDelete |
| `clinic_user_id` | FK → `clinic_users`, nullable | nullOnDelete; profissional |
| `admin_assessment_template_id` | FK → `admin_assessment_templates` | restrictOnDelete |
| `status` | string(20), default `draft` | `draft` \| `signed` |
| `signed_at` | timestamp nullable | |
| `created_at` / `updated_at` | timestamps | |
| `deleted_at` | soft delete | |

**Constantes**: `STATUS_DRAFT`, `STATUS_SIGNED`.

**Relações (FQN inline)**: `clinic`, `patient`, `clinicUser`, `template` (Admin — eager load via FK; validação via contrato público), `answers`, `answerOptions`.

**Transições**: rascunho editável; assinada imutável; destroy só em rascunho.

## AssessmentAnswer (`clinic_assessment_answers`)

| Campo | Tipo |
|-------|------|
| `id` | bigint PK |
| `assessment_id` | FK → `clinic_assessments` cascade |
| `admin_assessment_field_id` | FK → `admin_assessment_fields` restrict |
| `value` | text nullable |

## AssessmentAnswerOption (`clinic_assessment_answer_options`)

| Campo | Tipo |
|-------|------|
| `id` | bigint PK |
| `assessment_id` | FK cascade |
| `admin_assessment_field_id` | FK restrict |
| `admin_assessment_field_option_id` | FK restrict |

## PatientEvolution (`clinic_patient_evolutions`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | bigint PK | |
| `clinic_id` | FK → `clinics` | |
| `patient_id` | FK → `patients` | |
| `clinic_user_id` | FK nullable | |
| `evolution_template_id` | FK → `clinic_evolution_templates` nullable | |
| `title` | string | |
| `generated_text` | longText nullable | |
| `notes` | text nullable | |
| `status` | string(20), default `draft` | `draft` \| `signed` |
| `signed_at` | timestamp nullable | |
| timestamps + soft deletes | | |

**Relações**: `clinic`, `patient`, `clinicUser`, `template` (EvolutionTemplate — mesmo módulo), `checkedItems`.

## PatientEvolutionCheckedItem (`clinic_patient_evolution_checked_items`)

| Campo | Tipo |
|-------|------|
| `id` | bigint PK |
| `patient_evolution_id` | FK cascade |
| `evolution_template_item_id` | FK |
| `free_text_value` | text nullable |

## PatientFile (`clinic_patient_files`)

| Campo | Tipo |
|-------|------|
| `id` | bigint PK |
| `clinic_id`, `patient_id`, `clinic_user_id` | FKs |
| `original_name` | string |
| `name` | string nullable (migration add) |
| `file_path`, `cdn_url` | string |
| `mime_type` | string(100) |
| `size` | unsigned bigint |
| timestamps + soft deletes | |

## EvolutionTemplate (`clinic_evolution_templates`)

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | bigint PK | |
| `clinic_id` | FK nullable | null = system template |
| `name`, `description` | string/text | |
| `is_system` | boolean | seed template geral |
| `is_active` | boolean | |
| timestamps | | |

**Relações**: `sections` → `items`.

## EvolutionTemplateSection / EvolutionTemplateItem

Hierarquia template → sections (sort_order, title) → items (print_text, has_free_text, sort_order, etc.). Schema preservado das migrations atuais.

## Eventos de integração

Todos `final readonly` em `Modules\ClinicalRecord\Events`, `version=1`, `DB::afterCommit`. Detalhe em [contracts/integration-events.md](contracts/integration-events.md).

| Evento | Disparado em |
|--------|--------------|
| `AssessmentCreated` | create |
| `AssessmentUpdated` | update (PUT, rascunho) |
| `AssessmentCompleted` | sign |
| `EvolutionRecorded` | create, update (PUT), sign |
| `PatientFileAttached` | store |
| `PatientFileDeleted` | destroy (soft) |

**Não disparam evento**: `generate-text`, destroy assessment/evolution.

## Atores e autorização (preservado)

- **Assessment**: create/update/sign — fisioterapeuta owner; delete — admin via `Gate::before`.
- **Evolution**: create — fisioterapeuta; update/sign/generateText/pdf — conforme policies atuais; delete — rascunho only.
- **EvolutionTemplate**: admin clínica CRUD; system template protegido.
- **PatientFile**: upload/list — conforme policy; delete — policy + ownership.
- **Multi-tenant**: registro de outra clínica → 404.

## Namespace

Models: `Modules\ClinicalRecord\Models\*`. Factory: `PatientFileFactory` em `Modules\ClinicalRecord\Database\Factories`.
