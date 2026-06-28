---
description: "Task list — Clinical Record Extraction"
---

# Tasks: Clinical Record Extraction

**Input**: Design documents from `specs/008-clinical-record-extraction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluídos — fitness tests são obrigatórios (FR-025) e testes existentes de prontuário são movidos/refatorados com o código.

**Organization**: Agrupado por user story. US1 entrega paridade REST (app sobe, contrato idêntico); US2 garante fronteira via fitness tests; US3 prova eventos afterCommit. Convenções: relações cross-module por **FQN inline** (sem `use` de Models externos), `is_null()`/`! is_null()`, `empty()`/`! empty()`, Controller→`ServiceInterface`, Service→`RepositoryInterface`, eventos via `DB::afterCommit`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold do módulo `ClinicalRecord` espelhando `modules/ClinicScheduling`.

- [x] T001 Criar esqueleto de pastas em `modules/ClinicalRecord/` (`app/{Contracts,Events,Http/Controllers,Http/Requests,Models,Policies,Providers,Repositories,Services}`, `config`, `database/{factories,migrations,seeders}`, `routes`, `tests/{Feature,Unit}`)
- [x] T002 [P] Criar `modules/ClinicalRecord/composer.json` (PSR-4 `Modules\ClinicalRecord\` → `app/`, factories, seeders, tests; `extra.laravel.providers: []`) espelhando `modules/ClinicScheduling/composer.json`
- [x] T003 [P] Criar `modules/ClinicalRecord/module.json` (`name: ClinicalRecord`, `alias: clinicalrecord`, `providers: [Modules\ClinicalRecord\Providers\ClinicalRecordServiceProvider]`)
- [x] T004 [P] Criar `modules/ClinicalRecord/config/config.php` (`name => 'ClinicalRecord'`)
- [x] T005 Habilitar o módulo em `modules_statuses.json` (`"ClinicalRecord": true`) e rodar `composer dump-autoload`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Contrato Admin, migrations, models, contratos internos, eventos e repositories. Bloqueia US1/US2/US3.

**⚠️ CRITICAL**: Completar antes das user stories.

- [x] T006 [P] Criar `modules/Admin/app/Contracts/Public/AssessmentTemplateReadServiceInterface.php` conforme [contracts/public-contracts.md](contracts/public-contracts.md)
- [x] T007 Criar `modules/Admin/app/Services/AssessmentTemplateReadService.php` (implementa interface; encapsula queries atuais de `AdminAssessmentTemplate`; shapes compatíveis com index/show/validação) e registrar binding em `modules/Admin/app/Providers/AdminServiceProvider.php` — depende de T006
- [x] T008 `git mv` das 10 migrations de prontuário de `modules/Clinic/database/migrations/` → `modules/ClinicalRecord/database/migrations/` (`clinic_assessments`, `clinic_assessment_answers`, `clinic_assessment_answer_options`, `clinic_evolution_templates`, `clinic_evolution_template_sections`, `clinic_evolution_template_items`, `clinic_patient_evolutions`, `clinic_patient_evolution_checked_items`, `clinic_patient_files`, `add_name_to_clinic_patient_files`; conteúdo inalterado)
- [x] T009 [P] Mover/criar os 9 Models em `modules/ClinicalRecord/app/Models/` (`Assessment`, `AssessmentAnswer`, `AssessmentAnswerOption`, `EvolutionTemplate`, `EvolutionTemplateSection`, `EvolutionTemplateItem`, `PatientEvolution`, `PatientEvolutionCheckedItem`, `PatientFile`) com namespace `Modules\ClinicalRecord\Models`; relações cross-module (`patient`, `clinicUser`, `clinic`) por **FQN inline**; relações internas normais; `$table` e scopes preservados
- [x] T010 [P] Criar as 8 interfaces internas em `modules/ClinicalRecord/app/Contracts/` (`Assessment{Repository,Service}Interface`, `Evolution{Repository,Service}Interface`, `EvolutionTemplate{Repository,Service}Interface`, `PatientFile{Repository,Service}Interface`) conforme [contracts/internal-contracts.md](contracts/internal-contracts.md)
- [x] T011 [US3] Criar as 6 classes de evento `final readonly` em `modules/ClinicalRecord/app/Events/` (`AssessmentCreated`, `AssessmentUpdated`, `AssessmentCompleted`, `EvolutionRecorded`, `PatientFileAttached`, `PatientFileDeleted`) conforme [contracts/integration-events.md](contracts/integration-events.md)
- [x] T012 [P] Criar `modules/ClinicalRecord/app/Repositories/EvolutionTemplateRepository.php` (implements interface; queries de template tree + `hasEvolutions`) — depende de T009, T010
- [x] T013 [P] Criar `modules/ClinicalRecord/app/Repositories/AssessmentRepository.php` (CRUD assessment + answers/options; eager loads preservados) — depende de T009, T010
- [x] T014 [P] Criar `modules/ClinicalRecord/app/Repositories/EvolutionRepository.php` (CRUD evolution + checked items; queries para `generateText`) — depende de T009, T010
- [x] T015 [P] Criar `modules/ClinicalRecord/app/Repositories/PatientFileRepository.php` (listByPatient, create, soft delete) — depende de T009, T010

**Checkpoint**: Admin contract, migrations, models, contratos, eventos e repositories existem.

---

## Phase 3: User Story 1 - Frontend continua funcionando sem mudanças (Priority: P1) 🎯 MVP

**Goal**: Todos os endpoints REST de prontuário respondem nos mesmos paths/shapes, servidos por `ClinicalRecord`, com comportamento idêntico (status, policies, multi-tenant, upload, PDF, catálogo assessment-templates).

**Independent Test**: `php artisan route:list --path=clinic` mostra owners de prontuário em `Modules\ClinicalRecord\Http\Controllers\*`; `vendor/bin/phpunit modules/ClinicalRecord/tests` verde; app boota.

### Implementation for User Story 1

- [x] T016 [US1] Criar `modules/ClinicalRecord/app/Services/EvolutionTemplateService.php` (implements interface; delega ao Repository; regras de system template preservadas) — depende de T012
- [x] T017 [P] [US1] Mover `EvolutionTemplatePolicy` e FormRequests (`Store`/`UpdateEvolutionTemplateRequest`) → `modules/ClinicalRecord/app/Policies/` e `Http/Requests/` (namespace novo; `$user` sem type-hint `ClinicUser` se boundary exigir)
- [x] T018 [US1] Mover `EvolutionTemplateController` → `modules/ClinicalRecord/app/Http/Controllers/EvolutionTemplateController.php` (injeta `EvolutionTemplateServiceInterface`) — depende de T016, T017
- [x] T019 [US1] Criar `modules/ClinicalRecord/app/Services/AssessmentService.php` (implements interface; validação template via `AssessmentTemplateReadServiceInterface`; transações; despacha `AssessmentCreated`/`AssessmentUpdated`/`AssessmentCompleted` via `DB::afterCommit`; **sem** import de Models Admin) — depende de T007, T011, T013
- [x] T020 [P] [US1] Mover `AssessmentPolicy` e FormRequests (`Store`/`UpdateAssessmentRequest`) → `modules/ClinicalRecord/` (validação multi-tenant sem `use` de Models externos)
- [x] T021 [US1] Mover `AssessmentController` → `modules/ClinicalRecord/app/Http/Controllers/AssessmentController.php` (injeta `AssessmentServiceInterface` + `PatientServiceInterface` para validação de paciente) — depende de T019, T020
- [x] T022 [US1] Criar `modules/ClinicalRecord/app/Services/EvolutionService.php` (implements interface; `EvolutionRecorded` em create, update e sign; `generateText` read-only sem evento; delega Repository) — depende de T011, T014
- [x] T023 [P] [US1] Mover `PatientEvolutionPolicy` e FormRequests (`Store`/`UpdateEvolutionRequest`) → `modules/ClinicalRecord/`
- [x] T024 [US1] Mover `EvolutionController` → `modules/ClinicalRecord/app/Http/Controllers/EvolutionController.php` (injeta `EvolutionServiceInterface`, `PatientServiceInterface`, `PdfGeneratorInterface` — não `PdfService` concreto) — depende de T022, T023
- [x] T025 [US1] Criar `modules/ClinicalRecord/app/Services/PatientFileService.php` (implements interface; upload via `FileServiceInterface`; `PatientFileAttached`/`PatientFileDeleted` afterCommit; destroy DB-only sem delete R2) — depende de T011, T015
- [x] T026 [P] [US1] Mover `PatientFilePolicy` e `StorePatientFileRequest` → `modules/ClinicalRecord/`
- [x] T027 [US1] Mover `PatientFileController` → `modules/ClinicalRecord/app/Http/Controllers/PatientFileController.php` (injeta `PatientFileServiceInterface`, `FileServiceInterface`, `PatientServiceInterface`; remover route-model-binding `Patient $patient` → `int` + service) — depende de T025, T026
- [x] T028 [P] [US1] Mover `SharedAssessmentTemplateController` → `modules/ClinicalRecord/app/Http/Controllers/SharedAssessmentTemplateController.php` (consome `AssessmentTemplateReadServiceInterface`; sem Models Admin)
- [x] T029 [US1] Criar `modules/ClinicalRecord/routes/clinic.php` com **todas** as rotas de prontuário (nested `patients/{patient}/assessments|evolutions|files`, `assessments/*`, `evolutions/*`, `evolution-templates/*`, `assessment-templates/*`; names preservados conforme [contracts/rest-clinical-record.md](contracts/rest-clinical-record.md)) — depende de T018, T021, T024, T027, T028
- [x] T030 [P] [US1] Criar `modules/ClinicalRecord/app/Providers/RouteServiceProvider.php` (`prefix('api')->name('api.')` → `routes/clinic.php`) espelhando ClinicScheduling
- [x] T031 [P] [US1] Criar `modules/ClinicalRecord/app/Providers/EventServiceProvider.php` (`$shouldDiscoverEvents = true`)
- [x] T032 [US1] Criar `modules/ClinicalRecord/app/Providers/ClinicalRecordServiceProvider.php` (bindings 4 pares Service/Repository; `loadMigrationsFrom`; policies das 4 entidades; registrar Event/Route providers) — depende de T030, T031
- [x] T033 [US1] Remover de `modules/Clinic/routes/clinic.php` todas as rotas e `use` de controllers de prontuário (`Assessment`, `Evolution`, `EvolutionTemplate`, `PatientFile`, `SharedAssessmentTemplate`) — sem duplicatas
- [x] T034 [US1] Remover de `modules/Clinic/app/Providers/ClinicServiceProvider.php` bindings e `Gate::policy` de Assessment, PatientEvolution, EvolutionTemplate, PatientFile (e singleton `PatientFileService` se existir)
- [x] T035 [P] [US1] `git mv` `EvolutionTemplateSeeder` → `modules/ClinicalRecord/database/seeders/EvolutionTemplateSeeder.php` (namespace novo); atualizar `modules/Clinic/database/seeders/ClinicDatabaseSeeder.php` para chamar seeder do novo namespace
- [x] T036 [P] [US1] Mover `PatientFileFactory` → `modules/ClinicalRecord/database/factories/PatientFileFactory.php` (namespace `Modules\ClinicalRecord\Database\Factories`; `$model` → ClinicalRecord)
- [x] T037 [US1] Adaptar `modules/Clinic/database/seeders/ClinicPatientDataSeeder.php` (imports de Models de prontuário → `Modules\ClinicalRecord\Models\*`; comportamento demo preservado)
- [x] T038 [US1] Mover testes de prontuário de `modules/Clinic/tests/**` → `modules/ClinicalRecord/tests/**` (`PatientFileControllerTest`, `AssessmentPolicyTest`, `PatientEvolutionPolicyTest`, `PatientFilePolicyTest`, `EvolutionTemplatePolicyTest`; ajustar namespaces/`use`) — depende de T029

**Checkpoint**: REST de prontuário funcional via ClinicalRecord; app boota; testes Feature/Policy passam.

---

## Phase 4: User Story 2 - Prontuário é um módulo com fronteira limpa (Priority: P1)

**Goal**: `Clinic` não contém código/rota/regra de prontuário; fitness tests provam ownership, migrations e ausência de imports privados cross-module.

**Independent Test**: `vendor/bin/phpunit tests/Architecture` verde; grep por services/models de prontuário em `modules/Clinic/app` vazio (exceto seeders adaptados).

- [x] T039 [US2] Deletar de `modules/Clinic` os arquivos de prontuário remanescentes: Models (9), Services (4), Policies (4), Contracts internos (4 interfaces de service — repositories não existiam), Controllers (5), FormRequests (7), factory `PatientFileFactory`, seeder `EvolutionTemplateSeeder`
- [x] T040 [US2] Estender `tests/Architecture/ModuleBoundaryTest.php` para escanear `modules/ClinicalRecord/app` (método espelhando ClinicScheduling; assert zero violações de import privado cross-module)
- [x] T041 [P] [US2] Adicionar capability `clinical_record` com `status: extracted` em `tests/Architecture/fixtures/clinic-capability-map.php` (owns: tabelas de prontuário; routes: paths de [contracts/rest-clinical-record.md](contracts/rest-clinical-record.md)); ajustar `care` candidate removendo itens já extraídos
- [x] T042 [P] [US2] Estender `tests/Architecture/ExtractionReadinessTest.php` com `test_clinical_record_migrations_live_in_the_owner_module` (globs de prontuário ausentes em Clinic, presentes em ClinicalRecord)
- [x] T043 [P] [US2] Adicionar bloco `ClinicalRecord` em `tests/Architecture/fixtures/extraction-readiness.php`
- [x] T044 [US2] Criar `modules/ClinicalRecord/tests/Feature/ClinicalRecordRouteCompatibilityTest.php` espelhando `SchedulingRouteCompatibilityTest` (URIs de prontuário, métodos esperados, owners em `Modules\ClinicalRecord\Http\Controllers\`)

**Checkpoint**: `tests/Architecture` verde; nenhuma rota/código de prontuário em Clinic.

---

## Phase 5: User Story 3 - Integrações reagem a eventos de prontuário (Priority: P2)

**Goal**: Cada mutação persistida despacha o evento correto após commit, com snapshot mínimo e sem Model Eloquent. Sem listeners obrigatórios nesta extração.

**Independent Test**: `vendor/bin/phpunit modules/ClinicalRecord/tests/Unit/Events` verde.

- [x] T045 [P] [US3] Criar testes unitários em `modules/ClinicalRecord/tests/Unit/Events/ClinicalRecordServiceEventsTest.php` (espelhar `AppointmentServiceEventsTest`): Assessment create/update/sign, Evolution create/update/sign, PatientFile store/destroy — cada um despacha evento afterCommit com snapshot mínimo, sem Model — depende de T019, T022, T025
- [x] T046 [US3] Assert de arquitetura: classes em `modules/ClinicalRecord/app/Events/` não referenciam `Modules\ClinicalRecord\Models\*` (pode ser método em `ExtractionReadinessTest` ou teste dedicado)

**Checkpoint**: 6 eventos validados; SC-007 atendido.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T047 [P] Criar `docs/adr/009-clinical-record-extraction.md` (contexto, decisão, ownership, paths REST, tabelas, ADR-008 FQN inline, contrato Admin, sem read model público, extração futura)
- [x] T048 [P] Atualizar `docs/architecture/clinic-capability-map.md` (`clinical_record` → extracted)
- [x] T049 [P] Adicionar seção `ClinicalRecord` em `docs/architecture/extraction-readiness-checklist.md`
- [x] T050 Rodar `./vendor/bin/pint` e corrigir estilo
- [x] T051 Rodar `vendor/bin/phpunit tests/Architecture` e `vendor/bin/phpunit modules/ClinicalRecord/tests` — todos verdes
- [x] T052 Rodar `php artisan route:list --path=clinic` (sem rotas duplicadas de prontuário; owners corretos) e `php artisan migrate:fresh --seed`
- [x] T053 Rodar `composer run test` (regressão completa) e registrar resultados conforme [quickstart.md](quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: sem dependências.
- **Foundational (P2)**: depende de Setup. Bloqueia US1/US2/US3.
- **US1 (P3)**: depende de Foundational. MVP funcional.
- **US2 (P4)**: depende de US1 (deletar código antigo só após mover/wirar).
- **US3 (P5)**: depende de US1 (services com eventos existem).
- **Polish (P6)**: depende de US1+US2+US3.

### Within Stories

- T007 dep T006; T012–T015 dep T009+T010; T016 dep T012; T019 dep T007+T011+T013; T022 dep T011+T014; T025 dep T011+T015; controllers dep services+policies; T029 dep controllers; T032 dep T030+T031; T038 dep T029; T045 dep T019+T022+T025.

### Parallel Opportunities

- Setup: T002/T003/T004 [P].
- Foundational: T006/T009/T010/T012–T015 [P] (T007/T008 sequenciais onde indicado).
- US1: T017/T020/T023/T026/T028/T030/T031/T035/T036 [P].
- US2: T041/T042/T043 [P].
- US3: T045 [P].
- Polish: T047/T048/T049 [P].

---

## Implementation Strategy

### MVP (US1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1.
   **STOP & VALIDATE**: `route:list` + `modules/ClinicalRecord/tests`.

### Incremental (recomendado)

1. **US1** (move funcional por domínio: EvolutionTemplate → Assessment → Evolution → PatientFile → routes/providers/seeders/tests)
2. **US2** (cleanup Clinic + fitness tests)
3. **US3** (testes de eventos)
4. **Polish** (ADR + validação final)

### Ordem prática dentro de US1

EvolutionTemplate primeiro (evolutions dependem de templates) → Assessment (Admin contract) → Evolution → PatientFile → SharedAssessmentTemplate → routes/providers → cleanup Clinic parcial → seeders → tests.

---

## Notes

- [P] = arquivos diferentes, sem dependência mútua imediata.
- Não renomear tabelas `clinic_*`; não mudar paths/shapes REST.
- `generate-text` e destroy assessment/evolution **não** disparam eventos.
- `EvolutionRecorded` dispara em create, PUT update e POST sign (clarificação).
- PatientFile delete: soft-delete DB only (sem `FileServiceInterface::deleteFile`).
- Commit após cada task ou grupo lógico.
