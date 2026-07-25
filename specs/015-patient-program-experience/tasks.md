# Tasks: Patient Program Experience (Backend)

**Feature**: `015-patient-program-experience` · **Plan**: [plan.md](./plan.md)

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos — SC-001/SC-004 e o plano exigem Feature tests de isolamento e fluxo feliz. Detalhe público: assert `200` **sem** JWT; mutações/lista: `401` sem auth.

**Convenções**: Dono = `modules/TreatmentProgram`. Clean code: UseCase por ação em `app/Services/PatientProgram/`. Patient só auth. FE DDD em `resources/js/`. Paths relativos ao repo.

**Produto (não negociar)**:
- Copiar link (clínica) = `{app.url}/{clinicSlug}/paciente/programas/{publicToken}`
- Abrir sem login → SPA `/detalhe-programa?id={publicToken}` com detalhe visível
- `GET` detalhe por token = **público**; lista/execução/feedback/complete = JWT `patient`

**Skills**: `architecture-paradigm-modular-monolith`, `backend-clean-code`, `backend-module`, `php-testing`, `api-client`, `frontend-ddd`, `security`

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizável (arquivos diferentes, sem dependência de tarefa incompleta)
- **[Story]**: US1, US1b, US2–US5 conforme [spec.md](./spec.md)
- Toda tarefa inclui path de arquivo

---

## Phase 1: Setup

**Purpose**: Baseline e esqueleto de pastas no módulo dono

- [x] T001 Confirmar baseline: anotar estado de `composer run test` / `npm run types` antes das mudanças; criar pastas vazias `modules/TreatmentProgram/app/Services/PatientProgram/`, `modules/TreatmentProgram/app/Http/Controllers/Patient/`, `modules/TreatmentProgram/app/Http/Requests/Patient/`, `modules/TreatmentProgram/app/DTOs/PatientProgram/`, `modules/TreatmentProgram/tests/Feature/Patient/` (e interfaces patient em `modules/TreatmentProgram/app/Contracts/` se ainda não existirem)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, models, status mapper, rotas patient (GET público + mutações auth), guard FE — **bloqueia todas as user stories**

**⚠️ CRITICAL**: Nenhuma US começa antes do checkpoint

- [x] T002 Criar migration `modules/TreatmentProgram/database/migrations/xxxx_add_outcome_flags_to_clinic_treatment_plans.php`: `outcome_pain_enabled`, `outcome_difficulty_enabled`, `outcome_satisfaction_enabled` (boolean default `true`) em `clinic_treatment_plans` ([data-model.md](./data-model.md))
- [x] T003 [P] Criar migration `modules/TreatmentProgram/database/migrations/xxxx_create_clinic_treatment_plan_executions_table.php` conforme [data-model.md](./data-model.md) (FKs, `status`, `unfinished_exercise_ids` JSON, índices)
- [x] T004 [P] Criar migration `modules/TreatmentProgram/database/migrations/xxxx_create_clinic_treatment_plan_execution_series_table.php` conforme data-model
- [x] T005 [P] Criar migration `modules/TreatmentProgram/database/migrations/xxxx_create_clinic_treatment_plan_feedbacks_table.php` conforme data-model
- [x] T006 Atualizar `modules/TreatmentProgram/app/Models/TreatmentPlan.php`: fillable/casts das flags; relações `executions()`, `feedbacks()`
- [x] T007 [P] Criar models `modules/TreatmentProgram/app/Models/TreatmentPlanExecution.php`, `TreatmentPlanExecutionSeries.php`, `TreatmentPlanFeedback.php` (fillable, casts, relations)
- [x] T008 Criar `modules/TreatmentProgram/app/Support/PatientProgramStatusMapper.php` com regras de [research.md](./research.md) R3 (`available|scheduled|unavailable|completed|inactive`; draft → não elegível)
- [x] T009 Criar `modules/TreatmentProgram/app/Contracts/PatientProgramRepositoryInterface.php` + `modules/TreatmentProgram/app/Repositories/EloquentPatientProgramRepository.php`: `findByPublicToken` (público, exclui draft, eager-load groups.exercises.exercise) e `listByPatientClinic` (escopo `clinic_id`+`patient_id`, exclui draft)
- [x] T010 Registrar binds no `modules/TreatmentProgram/app/Providers/TreatmentProgramServiceProvider.php`; criar `modules/TreatmentProgram/routes/patient.php` com prefix `patient/programs`: **`GET /{publicToken}` sem `auth:patient`**; demais rotas (list, view, executions, feedback, complete) com `middleware('auth:patient')`; carregar rotas em `modules/TreatmentProgram/app/Providers/RouteServiceProvider.php` (precedente Media)
- [x] T011 Criar stub `modules/TreatmentProgram/app/Http/Controllers/Patient/PatientProgramController.php` (métodos vazios) e rotas nomeadas alinhadas a [contracts/patient-programs-rest.md](./contracts/patient-programs-rest.md)
- [x] T012 Rodar `php artisan migrate` (ou `migrate:fresh --seed` em dev) e confirmar colunas/tabelas; ajustar seeder `modules/TreatmentProgram/database/seeders/TreatmentPlanSeeder.php` se necessário para flags + `public_token`/`clinic.slug` para smoke do deep link
- [x] T013 [P] Estender `resources/js/infrastructure/api/client.ts` e `resources/js/infrastructure/api/auth.service.ts`: `AuthGuard` inclui `'patient'`; `inferGuardFromApiUrl` / storage / refresh tratam `/patient/*` (GET detalhe pode rodar sem Bearer)

**Checkpoint**: Schema + mapper + rotas (público vs auth) + guard FE prontos. User stories podem começar.

---

## Phase 3: User Story 1 — Detalhe público + deep link sem login (Priority: P1) 🎯 MVP

**Goal**: Qualquer pessoa com o token abre o detalhe (API + SPA). Deep link `/{clinicSlug}/paciente/programas/{publicToken}` sem login redireciona para `/detalhe-programa?id={publicToken}`. Paciente autenticado dono pode registrar view (idempotente).

**Independent Test**: `GET /api/patient/programs/{token}` **sem** Authorization → `200` com shape do contrato; draft/inexistente → `404`; deep link no browser sem sessão → URL `/detalhe-programa?id=…` com UI de detalhe; `POST …/view` sem JWT → `401`; view com dono → idempotente.

### Implementation (US1)

- [x] T014 [P] [US1] Criar DTOs/readonly mappers de resposta em `modules/TreatmentProgram/app/DTOs/PatientProgram/` (ex.: `PatientProgramDetailData`, exercise/prescription) — snake_case JSON alinhado ao contrato REST
- [x] T015 [US1] Implementar `modules/TreatmentProgram/app/Services/PatientProgram/GetPatientProgramDetailService.php` (repository público + StatusMapper; `current_execution`/`last_loads` só se houver paciente autenticado dono — anônimo → null; mínimo null até US3)
- [x] T016 [US1] Implementar `modules/TreatmentProgram/app/Services/PatientProgram/RegisterPatientProgramViewService.php` (exige paciente autenticado dono; idempotente em `patient_viewed_at`)
- [x] T017 [US1] Implementar `show` (público) e `view` (auth) em `PatientProgramController.php`; confirmar rotas em `modules/TreatmentProgram/routes/patient.php` (GET sem middleware auth; POST view com auth)
- [x] T018 [P] [US1] Criar `resources/js/infrastructure/repositories/api-patient-programs.ts` com `getByPublicToken` (sem exigir token JWT no client) + `registerView`; mapper snake→camel para `domain/patient/program.ts`
- [x] T019 [US1] Trocar mocks em `resources/js/application/patient/use-patient-program.ts` para `usePatientProgram` + `useRegisterProgramView` usarem o repository real; `registerView` só quando houver sessão paciente (falha não bloqueia UX)
- [x] T020 [US1] Garantir deep link em `resources/js/pages/patient/PatientProgramDeepLinkPage.tsx` + rotas em `resources/js/routes/patient/program-routes.tsx`: sem login, `/:clinicSlug/paciente/programas/:publicToken` redireciona para `/detalhe-programa?id={publicToken}` (slug cosmético no v1 — não validar contra clínica); `PatientProgramDetailPage` lê `id` da query e/ou param e carrega detalhe

### Tests (US1)

- [x] T021 [P] [US1] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramDetailTest.php`: detalhe OK **sem** JWT; draft/inexistente 404; view com dono idempotente; view sem JWT → 401; opcional: falha de view não impede GET detalhe (SC-005)

**Checkpoint**: Abrir deep link / detalhe sem login mostra programa real (MVP).

---

## Phase 4: User Story 1b — Clínica copia o deep link canônico (Priority: P1)

**Goal**: “Copiar o link do programa” e `share_url` usam `{origem}/{clinicSlug}/paciente/programas/{publicToken}` — nunca `/detalhe-programa?id=…`.

**Independent Test**: Com slug `clinica-cleverton` e token conhecido, copiar/link API = `http://…/clinica-cleverton/paciente/programas/{token}`.

### Implementation (US1b)

- [x] T022 [US1b] Garantir `share_url` / deep link em `modules/TreatmentProgram/app/Services/ProgramPdfViewModelBuilder.php` e/ou `modules/TreatmentProgram/app/Http/Controllers/TreatmentPlanController.php` (`planResponse`) no formato `{app.url}/{clinicSlug}/paciente/programas/{publicToken}`
- [x] T023 [US1b] Mapear/construir `shareUrl` em `resources/js/infrastructure/repositories/api-clinic-programs.ts` (e domínio `resources/js/domain/clinic/program.ts` se precisar `publicToken`/`clinicSlug`) para o mesmo formato; `resources/js/pages/clinic/program/ProgramHistoryTab.tsx` (`copyProgramLink`) e `resources/js/components/clinic/program/ProgramShareDialog.tsx` usam esse valor

### Tests (US1b)

- [x] T024 [P] [US1b] Unit/Feature assert do deep link (ex. `modules/TreatmentProgram/tests/Unit/ProgramPdfViewModelBuilderTest.php` e/ou teste do `share_url` na resposta do plan) no formato canônico com `clinicSlug` + `publicToken`

**Checkpoint**: Copiar na clínica cola o deep link certo; abrir sem login ainda cai em `/detalhe-programa`.

---

## Phase 5: User Story 2 — Lista de programas (Priority: P1)

**Goal**: Paciente autenticado lista só seus programas elegíveis com status e `exercise_count`. Lista **não** é pública.

**Independent Test**: Paciente com 2 planos active vê 2; plano de outro paciente/clínica nunca aparece; draft ausente; sem JWT → 401.

### Implementation (US2)

- [x] T025 [US2] Implementar `modules/TreatmentProgram/app/Services/PatientProgram/ListPatientProgramsService.php` (StatusMapper + exercise_count)
- [x] T026 [US2] Implementar `index` no `PatientProgramController.php` + rota `GET /` com `auth:patient` em `routes/patient.php`
- [x] T027 [P] [US2] Adicionar `list()` em `resources/js/infrastructure/repositories/api-patient-programs.ts` e ligar `usePatientPrograms` em `use-patient-program.ts`

### Tests (US2)

- [x] T028 [P] [US2] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramListTest.php`: escopo clinic+patient; draft excluído; status derivado coerente; 401 sem auth (SC-001)

**Checkpoint**: Lista autenticada + detalhe público no SPA.

---

## Phase 6: User Story 3 — Execução (start/resume, séries, unfinished, last load) (Priority: P1)

**Goal**: Iniciar/retomar uma execução `in_progress`, salvar séries/cargas, unfinished ids; devolver last load. Somente paciente autenticado dono.

**Independent Test**: Duas chamadas POST executions → mesmo id + `resumed`; série persistida; last load no detalhe/execução; completed/inactive bloqueia start; sem JWT → 401.

### Implementation (US3)

- [x] T029 [P] [US3] Criar `modules/TreatmentProgram/app/Contracts/TreatmentPlanExecutionRepositoryInterface.php` + `modules/TreatmentProgram/app/Repositories/EloquentTreatmentPlanExecutionRepository.php` (findInProgress, create, save series, update unfinished, lastLoads)
- [x] T030 [US3] Implementar `modules/TreatmentProgram/app/Services/PatientProgram/StartOrResumePatientProgramExecutionService.php` (bloqueia se status FE não for `available`; retoma `in_progress`)
- [x] T031 [P] [US3] Implementar `SavePatientProgramSeriesService.php` + FormRequest `modules/TreatmentProgram/app/Http/Requests/Patient/SavePatientProgramSeriesRequest.php`
- [x] T032 [P] [US3] Implementar `UpdateUnfinishedExercisesService.php` + FormRequest `modules/TreatmentProgram/app/Http/Requests/Patient/UpdateUnfinishedExercisesRequest.php`
- [x] T033 [US3] Expor no controller: `POST …/executions`, `POST …/executions/{id}/series`, `PATCH …/executions/{id}` (todas auth); enriquecer `GetPatientProgramDetailService` com `current_execution` + `last_loads` quando JWT dono
- [x] T034 [US3] Adicionar hooks/mutations em `resources/js/application/patient/use-patient-program.ts` (+ métodos no repository) para start/resume, series e unfinished; integrar páginas de execução; visitante anônimo que toca “Iniciar” deve ir ao login paciente (UX existente / redirect)

### Tests (US3)

- [x] T035 [P] [US3] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramExecutionTest.php`: resume, series, unfinished, last load, bloqueio se completed, 401 sem auth (FR-008a, FR-009a)

**Checkpoint**: Wizard de execução persiste progresso (com login).

---

## Phase 7: User Story 4 — Feedback + conclusão (Priority: P1)

**Goal**: Feedback em etapa própria (rejeita dimensão desabilitada); complete separado, idempotente, incrementa contador uma vez. Somente autenticado.

**Independent Test**: Feedback com flag off → 422; feedback OK não muda status; complete +1 contador e status `completed`; segundo complete `already_completed` sem +1; sem JWT → 401.

### Implementation (US4)

- [x] T036 [P] [US4] Criar `modules/TreatmentProgram/app/Contracts/TreatmentPlanFeedbackRepositoryInterface.php` + `EloquentTreatmentPlanFeedbackRepository.php`; binds no provider
- [x] T037 [US4] Implementar `SubmitPatientProgramFeedbackService.php` + `SubmitPatientProgramFeedbackRequest.php` (FR-012a: rejeitar dimensões desabilitadas; escalas 0–10 / enum satisfação)
- [x] T038 [US4] Implementar `CompletePatientProgramService.php` (exige feedback do ciclo se ≥1 flag on; marca execução completed; incrementa `patient_completed_count` uma vez; idempotente FR-013b)
- [x] T039 [US4] Rotas/controller `POST …/feedback` e `POST …/complete` em `routes/patient.php` + `PatientProgramController.php` (auth)
- [x] T040 [US4] Ligar `useSubmitProgramFeedback` + `useCompleteProgram` ao repository real em `use-patient-program.ts` / `api-patient-programs.ts`

### Tests (US4)

- [x] T041 [P] [US4] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramFeedbackCompleteTest.php`: 422 dimensão off; duas etapas; complete idempotente; 401 sem auth; SC-006

**Checkpoint**: Fluxo feedback → sucesso completo sem mock (com login).

---

## Phase 8: User Story 5 — Isolamento e autorização (Priority: P1)

**Goal**: Matriz de segurança alinhada à spec: detalhe anônimo OK só para token válido; list/writes sem auth negados; cross-patient/cross-clinic negados nas ações autenticadas.

**Independent Test**: Ver [spec.md](./spec.md) US5 — SC-004.

### Tests (US5)

- [x] T042 [US5] Feature test `modules/TreatmentProgram/tests/Feature/Patient/PatientProgramIsolationTest.php`: anônimo GET detalhe token válido → 200; anônimo list/view/executions/feedback/complete → 401; cross-clinic/cross-patient em escritas → 404; token inválido detalhe → 404 ([contracts/module-boundaries.md](./contracts/module-boundaries.md))
- [x] T043 [P] [US5] (Opcional) Arch/grep sanity: garantir que `modules/Patient` não importa `Modules\TreatmentProgram\Models` (documentar no teste ou script simples se o projeto já tiver arch tests)

**Checkpoint**: Isolamento verificável de ponta a ponta.

---

## Phase 9: Polish & Cross-Cutting

**Purpose**: Remover mock, qualidade, validação quickstart

- [x] T044 Remover dependência de `resources/js/infrastructure/repositories/mock-patient-programs.ts` do fluxo principal (deletar ou isolar em teste); confirmar pages/hooks só usam API
- [x] T045 [P] Revisar eager-load em `EloquentPatientProgramRepository` (evitar N+1 em groups/exercises/media) e mensagens de erro alinhadas aos textos de produto
- [x] T046 [P] Atualizar [quickstart.md](./quickstart.md) com smoke: curl GET detalhe **sem** Bearer; copiar share URL; abrir deep link → `/detalhe-programa`
- [x] T047 [P] Rodar `./vendor/bin/pint` nos PHP alterados; `npm run types` + `npm run lint` no FE
- [x] T048 Executar cenários de [quickstart.md](./quickstart.md); `vendor/bin/phpunit --filter=PatientProgram` e testes FE relevantes verdes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 Setup** → sem dependências
- **Phase 2 Foundational** → depende de Setup; **BLOQUEIA** US1–US5
- **US1 (Phase 3)** → após Foundational — **MVP** (detalhe público + redirect)
- **US1b (Phase 4)** → após Foundational; pode ir em paralelo com US1 (arquivos clínica vs patient API)
- **US2 (Phase 5)** → após Foundational; ideal após T018 se FE compartilha repository
- **US3 (Phase 6)** → após Foundational; US1 recomendado para enrich detail
- **US4 (Phase 7)** → após US3 se complete amarra execução; feedback pode iniciar após US1+flags
- **US5 (Phase 8)** → após endpoints das US1–US4 existirem
- **Polish** → após stories desejadas

### User Story Dependencies

| Story | Depende de | Independente para testar? |
|-------|------------|---------------------------|
| US1 Detalhe público + deep link | Foundational | Sim (MVP) |
| US1b Copiar link clínica | Foundational | Sim (share_url / copy) |
| US2 Lista | Foundational (+ T018 se FE) | Sim (API auth) |
| US3 Execução | Foundational; US1 para enrich detail | Sim (API executions) |
| US4 Feedback+complete | Foundational; US3 para ciclo com execução | Sim (API) |
| US5 Isolamento | Endpoints US1–US4 | Sim (só testes) |

### Parallel Opportunities

- T003, T004, T005 (migrations) em paralelo
- T007 models em paralelo após migrations
- T013 FE guard // backend foundational
- US1b (T022–T024) // US1 (T014–T021) após Foundational
- T031 // T032 FormRequests/services
- T045 // T046 // T047 no polish

---

## Parallel Example: User Story 1

```bash
# Após T017 (controller wired):
Task: "T018 api-patient-programs getByPublicToken (no JWT required)"
Task: "T021 PatientProgramDetailTest — public GET + auth view"
# Depois:
Task: "T019 hooks reais"
Task: "T020 DeepLinkPage → /detalhe-programa?id="
```

---

## Parallel Example: User Story 1b + US1

```bash
Task: "T022–T023 share_url / copyProgramLink deep link canônico"
Task: "T015–T017 GetPatientProgramDetailService público"
```

---

## Parallel Example: User Story 3

```bash
Task: "T031 SavePatientProgramSeriesService + FormRequest"
Task: "T032 UpdateUnfinishedExercisesService + FormRequest"
# Depois serial: T033 controller + T035 tests
```

---

## Implementation Strategy

### MVP First (US1 + US1b)

1. Phase 1 + Phase 2  
2. Phase 3 (US1) — detalhe público + deep link → `/detalhe-programa`  
3. Phase 4 (US1b) — copiar link canônico na clínica  
4. **STOP** — validar: copiar cola deep link; abrir sem login vê o programa  

### Incremental Delivery

1. MVP US1 + US1b → demo compartilhar + ver sem login  
2. US2 → lista autenticada  
3. US3 → execução persistida  
4. US4 → feedback + complete  
5. US5 → matriz de isolamento  
6. Polish → mock removido + pint/types/quickstart  

### Suggested MVP scope

**US1 + US1b** (T001–T024): detalhe público, redirect sem login, copiar deep link na clínica.

---

## Notes

- Não importar Models TreatmentProgram em `modules/Patient`
- Controllers sem `DB::` / Eloquent direto
- Null PHP: `is_null()` / `!is_null()`; strings: `empty()` / `!empty()`
- Commit por tarefa ou grupo lógico (quando o usuário pedir)
- Contrato REST: [contracts/patient-programs-rest.md](./contracts/patient-programs-rest.md)
- Spec produto: [spec.md](./spec.md) Clarifications “acesso e link”
