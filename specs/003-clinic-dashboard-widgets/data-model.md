# Phase 1 — Data Model: Dashboard da Clínica

Entidades **novas** ou **alteradas** por esta feature. As entidades apenas **lidas** (Patient, Appointment, TreatmentPlan, Exercise/ExerciseMedia, ClinicUser) não mudam de schema — só são consultadas; estão descritas em "Entidades lidas".

---

## 1. ClinicActivity (NOVO) — `clinic_activities`

Log dedicado de eventos da clínica que alimenta o widget "Atividades recentes" (FR-022a/b).

| Coluna | Tipo | Regras |
|--------|------|--------|
| `id` | bigint PK | |
| `clinic_id` | bigint FK → `clinics.id` | obrigatório; `cascadeOnDelete`; índice |
| `clinic_user_id` | bigint FK → `clinic_users.id` | **nullable** (ator; pode ser nulo se ação do sistema); `nullOnDelete` |
| `type` | string(40) | obrigatório; valores do enum `ActivityType` |
| `description` | string(255) | obrigatório; texto pt-BR já renderizado (ex.: "Programa criado — Reabilitação de Joelho · Maria Silva") |
| `subject_type` | string(255) | nullable (morph leve — nome da classe do registro de origem) |
| `subject_id` | bigint | nullable |
| `created_at` | timestamp | obrigatório; índice (feed do dia, ordenação desc) |
| `updated_at` | timestamp | nullable (log é imutável; manter por convenção Eloquent) |

**Índices**: `(clinic_id, created_at)` composto para o feed do dia ordenado.

**Enum `ActivityType`** (string-backed, com `label()` pt-BR) — FR-022b:

| case | value | descrição base |
|------|-------|----------------|
| `PatientCreated` | `patient_created` | Novo paciente cadastrado |
| `PatientUpdated` | `patient_updated` | Paciente editado |
| `ProgramCreated` | `program_created` | Programa criado |
| `ProgramCompleted` | `program_completed` | Programa concluído |
| `AppointmentScheduled` | `appointment_scheduled` | Consulta agendada |
| `AppointmentCompleted` | `appointment_completed` | Consulta concluída |
| `AppointmentCancelled` | `appointment_cancelled` | Consulta cancelada |
| `ExercisesAdded` | `exercises_added` | Exercícios adicionados (a um programa) |

**Relacionamentos**: `belongsTo(Clinic)`, `belongsTo(ClinicUser, 'clinic_user_id')` (ator), `morphTo('subject')`.

**Escopos**: `scopeForClinic($q, $clinicId)`; `scopeToday($q, $tz)` (filtra `created_at` no dia corrente do timezone da clínica).

**Ciclo de vida**: criado pelo `ActivityLogger::log()`; nunca atualizado/excluído pela feature. Retenção/limpeza fora de escopo (v1).

---

## 2. Clinic (ALTERADO) — `clinics` (+3 colunas)

Janela de atendimento usada como denominador da Taxa de ocupação (FR-019a). Migration `create_clinics_table` **editada** (convenção dev: sem migration incremental).

| Coluna (nova) | Tipo | Default | Regras |
|---------------|------|---------|--------|
| `working_start` | time | `08:00:00` | horário de início do atendimento |
| `working_end` | time | `18:00:00` | horário de fim; deve ser > `working_start` (validado na config, fora do dashboard) |
| `working_days` | json | `[1,2,3,4,5]` | dias ISO atendidos (1=segunda … 7=domingo) |

**Helper no model**: `workingWindow(): array` devolve `{ start, end, days }` com fallback aos defaults se nulo. Reutiliza `timezone` (coluna já existente, default `America/Sao_Paulo`).

> A **edição** desses campos (tela de configuração da clínica) está **fora do escopo** desta feature — o dashboard apenas lê. Os defaults garantem cálculo válido sem configuração prévia.

---

## 3. DashboardScope (NOVO — Value Object, sem persistência)

Resolve a visibilidade por papel num único ponto (research §2). Não é tabela.

| Campo | Tipo | Origem |
|-------|------|--------|
| `clinicId` | int | `user.clinic_id` |
| `clinicUserId` | int\|null | regra abaixo |
| `isClinicWide` | bool | derivado |

Regra de construção a partir de (`ClinicUser $user`, `string $scope`):
- `secretary` → `clinicUserId = null` (sempre clínica inteira); `scope=mine` ignorado.
- `admin` → `scope=mine` ⇒ `clinicUserId = user.id`; senão `null`.
- `physiotherapist` → `clinicUserId = user.id` **sempre** (param ignorado).

`canChooseAnyProfessional(): bool` = `admin || secretary` (usado no widget de ocupação e no toggle de UI).

---

## Entidades lidas (sem alteração de schema)

| Entidade | Tabela | Campos usados | Widget |
|----------|--------|---------------|--------|
| Patient | `patients` | `status`, `clinic_user_id`, `birth_date`, `referral_source`, `phone`, `name`, `photo_url`, `created_at` | Pacientes ativos, Aniversariantes, Captação |
| Appointment | `clinic_appointments` | `starts_at`, `ends_at`, `status`, `clinic_user_id`, `patient_id`, `title` | Consultas hoje, Próximas consultas, Taxa de ocupação |
| TreatmentPlan | `clinic_treatment_plans` | `status`, `start_date`, `end_date`, `clinic_user_id`, `patient_id` | Programas ativos |
| Exercise | `admin_exercises` (+ `admin_exercise_media`, `BodyRegion`) | ativos com mídia; `body_region_id` (categorias) | Exercícios disponíveis |
| ClinicUser | `clinic_users` | `id`, `name`, `role`, `photo_url`; `whereHas('appointments')` | escopo + seletor de fisio |

---

## Validação derivada dos requisitos

- **FR-006**: `Patient.status NOT IN (obito, cancelado, alta)`.
- **FR-008**: `TreatmentPlan.status = active` ∧ paciente ativo ∧ vigência ∩ mês corrente.
- **FR-007/010**: `Appointment.starts_at ∈ hoje (tz clínica)` ∧ `status != cancelled`; próximas = `ORDER BY starts_at ASC LIMIT 5`.
- **FR-019a/b**: ocupação = Σ duração consultas ÷ Σ janela atendimento, por bucket (Diária=dias do mês, Semanal=12 semanas, Mensal=meses do ano).
- **FR-016**: captação = matriz `[ano corrente, −1, −2, consolidado] × origens` com `count` e `percent`.
- **FR-022b**: `ActivityType` tem exatamente os 8 casos listados.
- **FR-005/SC-004**: nenhuma query usa `clinic_user_id` vindo do cliente sem passar pelo `DashboardScope` (papel-forçado).
