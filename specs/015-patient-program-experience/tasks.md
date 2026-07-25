# Tasks: Patient Program Experience (Backend)

**Feature**: `015-patient-program-experience` · **Plan**: [plan.md](./plan.md)

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — SC-001/SC-004 e o plano exigem Feature tests de isolamento e fluxo feliz (`actingAs($patient, 'patient')`). Vitest opcional para mapper FE.

**Convenções**: Dono = `modules/TreatmentProgram`. Clean code: UseCase por ação em `app/Services/PatientProgram/`. Patient só auth. FE DDD em `resources/js/`. Paths relativos ao repo.

**Skills**: `architecture-paradigm-modular-monolith`, `backend-clean-code`, `backend-module`, `php-testing`, `api-client`, `frontend-ddd`, `security`

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizável (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1–US5 conforme [spec.md](./spec.md)
- Toda tarefa inclui path de arquivo

---

## Phase 1: Setup

**Purpose**: Baseline e esqueleto de pastas no módulo dono

- [ ] T001 Confirmar baseline: anotar estado de `composer run test` / `npm run types` antes das mudanças; criar pastas vazias `modules/TreatmentProgram/app/Services/PatientProgram/`, `modules/TreatmentProgram/app/Http/Controllers/Patient/`, `modules/TreatmentProgram/app/Http/Requests/Patient/`, `modules/TreatmentProgram/app/DTOs/PatientProgram/`, `modules/TreatmentProgram/app/Contracts/` (interfaces patient program), `modules/TreatmentProgram/tests/Feature/Patient/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, models, status mapper, rotas patient, guard FE — **bloqueia todas as user stories**

**⚠️ CRITICAL**: Nenhuma US começa antes do checkpoint

- [ ] T002 Criar migration `modules/TreatmentProgram/database/migrations/xxxx_add_outcome_flags_to_clinic_treatment_plans.php`: `outcome_pain_enabled`, `outcome_difficulty_enabled`, `outcome_satisfaction_enabled` (boolean default `true`) em `clinic_treatment_plans` ([data-model.md](./data-model.md))
- [ ] T003 [P] Criar migration `modules/TreatmentProgram/database/migrations/xxxx_create_clinic_treatment_plan_executions_table.php` conforme [data-model.md](./data-model.md) (FKs, `status`, `unfinished_exercise_ids` JSON, índices)
- [ ] T004 [P] Criar migration `modules/TreatmentProgram/database/migrations/xxxx_create_clinic_treatment_plan_execution_series_table.php` conforme data-model
- [ ] T005 [P] Criar migration `modules/TreatmentProgram/database/migrations/xxxx_create_clinic_treatment_plan_feedbacks_table.php` conforme data-model
- [ ] T006 Atualizar `modules/TreatmentProgram/app/Models/TreatmentPlan.php`: fillable/casts das flags; relações `executions()`, `feedbacks()`
- [ ] T007 [P] Criar models `modules/TreatmentProgram/app/Models/TreatmentPlanExecution.php`, `TreatmentPlanExecutionSeries.php`, `TreatmentPlanFeedback.php` (fillable, casts, relations)
- [ ] T008 Criar `modules/TreatmentProgram/app/Support/PatientProgramStatusMapper.php` com regras de [research.md](./research.md) R3 (`available|scheduled|unavailable|completed|inactive`; draft → não elegível)
- [ ] T009 Criar contratos internos + repositório de leitura de planos paciente: `modules/TreatmentProgram/app/Contracts/PatientProgramRepositoryInterface.php` e `modules/TreatmentProgram/app/Repositories/EloquentPatientProgramRepository.php` (listByPatientClinic, findByPublicTokenForPatient — escopo `clinic_id`+`patient_id`, exclui draft; eager-load groups.exercises.exercise)
- [ ] T010 Registrar binds no `modules/TreatmentProgram/app/Providers/TreatmentProgramServiceProvider.php`; criar `modules/TreatmentProgram/routes/patient.php` (grupo `prefix('patient/programs')->middleware('auth:patient')`) e carregá-lo em `modules/TreatmentProgram/app/Providers/RouteServiceProvider.php` (precedente Media)
- [ ] T011 Criar stub `modules/TreatmentProgram/app/Http/Controllers/Patient/PatientProgramController.php` (métodos vazios/404) e rotas nomeadas alinhadas a [contracts/patient-programs-rest.md](./contracts/patient-programs-rest.md)
- [ ] T012 Rodar `php artisan migrate` (ou `migrate:fresh --seed` em dev) e confirmar colunas/tabelas; ajustar seeder `modules/TreatmentProgram/database/seeders/TreatmentPlanSeeder.php` se necessário para flags
- [ ] T013 [P] Estender `resources/js/infrastructure/api/client.ts` e `resources/js/infrastructure/api/auth.service.ts`: `AuthGuard` inclui `'patient'`; `inferGuardFromApiUrl` / storage / refresh tratam `/patient/*`

**Checkpoint**: Schema + mapper + rotas patient + guard FE prontos. User stories podem começar.

---

## Phase 3: User Story 1 — Detalhe do programa + visualização (Priority: P1) 🎯 MVP

**Goal**: Paciente autenticado obtém detalhe por `publicToken` (grupos, exercícios, flags) e registra view idempotente sem bloquear UX.

**Independent Test**: `GET …/programs/{token}` retorna shape do contrato para dono; outro paciente/`draft` → 404; `POST …/view` seta `patient_viewed_at` sem erro na segunda chamada.

### Implementation (US1)

- [ ] T014 [P] [US1] Criar DTOs/readonly mappers de resposta em `modules/TreatmentProgram/app/DTOs/PatientProgram/` (ex.: `PatientProgramDetailData`, exercise/prescription) — snake_case JSON alinhado ao contrato REST
- [ ] T015 [US1] Implementar `modules/TreatmentProgram/app/Services/PatientProgram/GetPatientProgramDetailService.php` (usa repository + StatusMapper; inclui `current_execution` null por enquanto ou se já existir execução — mínimo null até US3)
- [ ] T016 [US1] Implementar `modules/TreatmentProgram/app/Services/PatientProgram/RegisterPatientProgramViewService.php` (idempotente em `patient_viewed_at`)
- [ ] T017 [US1] Implementar `show` e `view` em `PatientProgramController.php` (fino: auth user → service → `{ data }`); completar rotas GET `/{publicToken}` e POST `/{publicToken}/view` em `routes/patient.php`
- [ ] T018 [P] [US1] Criar `resources/js/infrastructure/repositories/api-patient-programs.ts` com `getByPublicToken` + `registerView` (mapper snake→camel para `domain/patient/program.ts`)
- [ ] T019 [US1] Trocar mocks em `resources/js/application/patient/use-patient-program.ts` para `usePatientProgram` + `useRegisterProgramView` usarem o repository real

### Tests (US1)

- [ ] T020 [P] [US1] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramDetailTest.php`: detalhe OK; 404 cross-patient/cross-clinic/draft; view idempotente; `401` sem token (`actingAs` guard `patient`)

**Checkpoint**: Deep link/detalhe + view funcionam sem mock (MVP backend+FE detalhe).

---

## Phase 4: User Story 2 — Lista de programas (Priority: P1)

**Goal**: Paciente lista só seus programas elegíveis com status e `exercise_count`.

**Independent Test**: Paciente com 2 planos active vê 2; plano de outro paciente/clínica nunca aparece; draft ausente.

### Implementation (US2)

- [ ] T021 [US2] Implementar `modules/TreatmentProgram/app/Services/PatientProgram/ListPatientProgramsService.php` (StatusMapper + exercise_count)
- [ ] T022 [US2] Implementar `index` no `PatientProgramController.php` + rota `GET /` em `routes/patient.php`
- [ ] T023 [P] [US2] Adicionar `list()` em `resources/js/infrastructure/repositories/api-patient-programs.ts` e ligar `usePatientPrograms` em `use-patient-program.ts`

### Tests (US2)

- [ ] T024 [P] [US2] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramListTest.php`: escopo clinic+patient; draft excluído; status derivado coerente (SC-001)

**Checkpoint**: Lista + detalhe reais no SPA.

---

## Phase 5: User Story 3 — Execução (start/resume, séries, unfinished, last load) (Priority: P1)

**Goal**: Iniciar/retomar uma execução `in_progress`, salvar séries/cargas, unfinished ids; devolver last load.

**Independent Test**: Duas chamadas POST executions → mesmo id + `resumed`; série persistida; last load no detalhe/execução; completed/inactive bloqueia start.

### Implementation (US3)

- [ ] T025 [P] [US3] Criar `modules/TreatmentProgram/app/Contracts/TreatmentPlanExecutionRepositoryInterface.php` + `modules/TreatmentProgram/app/Repositories/EloquentTreatmentPlanExecutionRepository.php` (findInProgress, create, save series, update unfinished, lastLoads)
- [ ] T026 [US3] Implementar `StartOrResumePatientProgramExecutionService.php` (bloqueia se status FE não for `available`; retoma `in_progress`)
- [ ] T027 [P] [US3] Implementar `SavePatientProgramSeriesService.php` + FormRequest `modules/TreatmentProgram/app/Http/Requests/Patient/SavePatientProgramSeriesRequest.php`
- [ ] T028 [P] [US3] Implementar `UpdateUnfinishedExercisesService.php` + FormRequest `UpdateUnfinishedExercisesRequest.php`
- [ ] T029 [US3] Expor no controller: `POST …/executions`, `POST …/executions/{id}/series`, `PATCH …/executions/{id}`; enriquecer `GetPatientProgramDetailService` com `current_execution` + `last_loads`
- [ ] T030 [US3] Adicionar hooks/mutations em `resources/js/application/patient/use-patient-program.ts` (+ métodos no repository) para start/resume, series e unfinished; integrar páginas de execução existentes

### Tests (US3)

- [ ] T031 [P] [US3] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramExecutionTest.php`: resume, series, unfinished, last load, bloqueio se completed (FR-008a, FR-009a)

**Checkpoint**: Wizard de execução pode persistir progresso de verdade.

---

## Phase 6: User Story 4 — Feedback + conclusão (Priority: P1)

**Goal**: Feedback em etapa própria (rejeita dimensão desabilitada); complete separado, idempotente, incrementa contador uma vez.

**Independent Test**: Feedback com flag off → 422; feedback OK não muda status; complete +1 contador e status `completed`; segundo complete `already_completed` sem +1.

### Implementation (US4)

- [ ] T032 [P] [US4] Criar `modules/TreatmentProgram/app/Contracts/TreatmentPlanFeedbackRepositoryInterface.php` + `EloquentTreatmentPlanFeedbackRepository.php`; binds no provider
- [ ] T033 [US4] Implementar `SubmitPatientProgramFeedbackService.php` + `SubmitPatientProgramFeedbackRequest.php` (FR-012a: rejeitar dimensões desabilitadas; escalas 0–10 / enum satisfação)
- [ ] T034 [US4] Implementar `CompletePatientProgramService.php` (exige feedback do ciclo se ≥1 flag on; marca execução completed; incrementa `patient_completed_count` uma vez; idempotente FR-013b)
- [ ] T035 [US4] Rotas/controller `POST …/feedback` e `POST …/complete` em `routes/patient.php` + `PatientProgramController.php`
- [ ] T036 [US4] Ligar `useSubmitProgramFeedback` + `useCompleteProgram` ao repository real em `use-patient-program.ts` / `api-patient-programs.ts`

### Tests (US4)

- [ ] T037 [P] [US4] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramFeedbackCompleteTest.php`: 422 dimensão off; duas etapas; complete idempotente; SC-006

**Checkpoint**: Fluxo feedback → sucesso completo sem mock.

---

## Phase 7: User Story 5 — Isolamento multi-tenant (Priority: P1)

**Goal**: Matriz de segurança em **todas** as ações da experiência.

**Independent Test**: Cross-clinic, cross-patient e unauthenticated → 401/404 em list/detail/view/executions/series/unfinished/feedback/complete (SC-004).

### Tests (US5)

- [ ] T038 [US5] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramIsolationTest.php` cobrindo a matriz de [spec.md](./spec.md) US5 + [contracts/module-boundaries.md](./contracts/module-boundaries.md)
- [ ] T039 [P] [US5] (Opcional) Arch/grep sanity: garantir que `modules/Patient` não importa `Modules\TreatmentProgram\Models` (documentar no teste ou script simples se o projeto já tiver arch tests)

**Checkpoint**: Isolamento verificável de ponta a ponta.

---

## Phase 8: Polish & Cross-Cutting

**Purpose**: Remover mock, qualidade, validação quickstart

- [ ] T040 Remover dependência de `resources/js/infrastructure/repositories/mock-patient-programs.ts` do fluxo principal (deletar ou isolar em teste); confirmar pages/hooks só usam API
- [ ] T041 [P] Revisar eager-load em `EloquentPatientProgramRepository` (evitar N+1 em groups/exercises/media) e mensagens de erro alinhadas aos textos de produto
- [ ] T042 [P] Rodar `./vendor/bin/pint` nos PHP alterados; `npm run types` + `npm run lint` no FE
- [ ] T043 Executar cenários de [quickstart.md](./quickstart.md); `vendor/bin/phpunit --filter=PatientProgram` e testes FE relevantes verdes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup** → sem dependências
- **Phase 2 Foundational** → depende de Setup; **BLOQUEIA** US1–US5
- **US1 (Phase 3)** → após Foundational — **MVP**
- **US2 (Phase 4)** → após Foundational; ideal após US1 se FE compartilha repository (T018)
- **US3 (Phase 5)** → após Foundational; detalhe (US1) recomendado para `current_execution` no GET
- **US4 (Phase 6)** → após US3 se complete amarra execução; feedback pode iniciar após US1+flags
- **US5 (Phase 7)** → após endpoints das US1–US4 existirem
- **Polish** → após stories desejadas

### User Story Dependencies

| Story | Depende de | Independente para testar? |
|-------|------------|---------------------------|
| US1 Detalhe+view | Foundational | Sim (MVP) |
| US2 Lista | Foundational (+ T018 se FE) | Sim (API) |
| US3 Execução | Foundational; US1 para enrich detail | Sim (API executions) |
| US4 Feedback+complete | Foundational; US3 para ciclo com execução | Sim (API) |
| US5 Isolamento | Endpoints US1–US4 | Sim (só testes) |

### Parallel Opportunities

- T003, T004, T005 (migrations) em paralelo após T002 ou juntas
- T007 models em paralelo após migrations
- T013 FE guard em paralelo com backend foundational
- T018 FE repository // T020 tests após T017
- T027 // T028 FormRequests/services
- T032 // início de T033 após contracts
- T041 // T042 no polish

---

## Parallel Example: User Story 1

```bash
# Após T017 (controller wired):
Task: "T018 api-patient-programs getByPublicToken + registerView"
Task: "T020 PatientProgramDetailTest Feature"
# Depois:
Task: "T019 hooks reais usePatientProgram / useRegisterProgramView"
```

---

## Parallel Example: User Story 3

```bash
Task: "T027 SavePatientProgramSeriesService + FormRequest"
Task: "T028 UpdateUnfinishedExercisesService + FormRequest"
# Depois serial: T029 controller + T031 tests
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 + Phase 2  
2. Phase 3 (US1) — detalhe + view + FE sem mock no deep link  
3. **STOP** — validar Independent Test US1 + quickstart parcial  

### Incremental Delivery

1. MVP US1 → demo deep link real  
2. US2 → lista  
3. US3 → execução persistida  
4. US4 → feedback + complete  
5. US5 → matriz de isolamento  
6. Polish → mock removido + pint/types/quickstart  

### Suggested MVP scope

**US1 apenas** (T001–T020): paciente abre programa real pelo token e registra visualização.

---

## Notes

- Não importar Models TreatmentProgram em `modules/Patient`
- Controllers sem `DB::` / Eloquent direto
- Null PHP: `is_null()` / `!is_null()`; strings: `empty()` / `!empty()`
- Commit por tarefa ou grupo lógico (quando o usuário pedir)
- Contrato REST: [contracts/patient-programs-rest.md](./contracts/patient-programs-rest.md)
