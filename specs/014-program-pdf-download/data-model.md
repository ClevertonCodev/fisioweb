# Data Model: Download PDF do Programa de Tratamento

**Feature**: `014-program-pdf-download`  
**Date**: 2026-07-16

Nenhuma tabela nova. Nenhuma migration nova. Entidades abaixo são as já existentes, com regras de uso para o PDF e o cadastro de imagens de referência.

## Entities

### TreatmentPlan (Programa)

- **Tabela**: `clinic_treatment_plans` (módulo `TreatmentProgram`)
- **Campos relevantes**: `id`, `clinic_id`, `clinic_user_id`, `patient_id` (nullable), `title`, `start_date`, `end_date`, `duration_minutes`, `notes`, `message`, `status`
- **Relações**: `clinicUser`, `patient`, `clinic`, `groups` → `exercises` → `exercise` → `media` / `videos`
- **Regras PDF**:
  - Download permitido se o usuário clinic pode visualizar o plano (mesmo isolamento `clinic_id`; qualquer status visível)
  - Observações da capa: `notes` se preenchido, senão `message`
  - Período: `start_date` → `end_date`; duração em dias = diferença inclusiva quando ambas existem
  - Anotações: até 3 primeiros meses civis do intervalo

### TreatmentPlanGroup

- **Tabela**: `clinic_treatment_plan_groups`
- **Campos**: `name`, `sort_order`, …
- **Regra PDF**: nome vazio/whitespace → rótulo de exibição **Novo Grupo** (não altera persistência)

### TreatmentPlanExercise

- **Tabela**: `clinic_treatment_plan_exercises`
- **Campos de parâmetros**: `days_of_week`, `sets_min`/`sets_max`, `repetitions_min`/`repetitions_max`, `rest_time`, `notes`, … (+ campos de duração/esforço se já existirem no modelo)
- **Ordem**: ordem do grupo + ordem do exercício no programa

### Exercise (catálogo Admin)

- **Tabela**: `admin_exercises`
- **Relações**: `media()` → `ExerciseMedia` ordenado por `sort_order`; `videos()`

### ExerciseMedia (imagens de referência)

- **Tabela**: `admin_exercise_media` (já existe)
- **Campos**: `exercise_id`, `type` (`image`|`audio`), `file_path`, `cdn_url`, `original_filename`, `mime_type`, `size`, `sort_order`
- **Regras**:
  - Para PDF: `type = image`, `sort_order` 0 e 1 (máx. 2)
  - `cdn_url` obrigatório para render no DomPDF
  - Upload admin substitui o conjunto (0..2) atomicamente por exercício
  - Seeds: 2 URLs R2 fixas (ver `ExerciseSeeder`)

### Video (Media)

- **Tabela**: `media_videos`
- **Uso extra**: `metadata.reference_images` (array de até 2 `{ path, cdn_url, ... }`) como staging quando o vídeo ainda não tem exercícios ligados
- **Fallback PDF**: se exercício sem `ExerciseMedia`, usar `videos.metadata.reference_images` ou `thumbnail_url`

### ClinicUser (responsável)

- **Tabela**: `clinic_users`
- **Campos PDF**: `name`, `photo_url`, `email`, `document` (exibido como credencial)
- **Telefone**: não existe no model — fallback `Clinic.phone`

### Clinic

- **Campos**: `slug` (deep link), `phone`, `email`, `name`
- **Deep link QR**: `{APP_URL}/{slug}/paciente/programas/{treatmentPlanId}`

### Patient

- **Uso**: nome na capa (“Para: …”); presença necessária para emitir QR; sem paciente → sem QR

## Derived / View-model (não persistido)

### ProgramPdfCover

- responsiblePhotoUrl | initials
- responsibleName, credential, email, phone?
- qrUrl?, qrImageDataUri?
- title, patientLabel, estimatedMinutes?, periodLabel?, periodDays?, observations?

### ProgramPdfAnnotationMonth

- monthKey (`YYYY-MM`), title (`Anotações de {Mês}`)
- days: `{ date, dayOfMonth, weekdayShort, inPeriod }` (máx. os dias do período naquele mês)
- Cap: 3 meses

## Validation rules (admin media)

| Rule | Constraint |
|------|------------|
| Max images | 2 por exercício |
| Types | image/jpeg, image/png, image/webp (alinhar ao upload existente) |
| Optional | 0 imagens permitidas |
| Size | limites do upload R2/presigned já usados no admin |

## State transitions

Nenhuma transição de status de programa introduzida por esta feature. Download não altera `status` do plano.
