---
description: "Task list — Treatment Program Extraction"
---

# Tasks: Treatment Program Extraction

**Input**: Design documents from `specs/010-treatment-program-extraction/`
**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)

**Tests**: Incluídos — a spec exige preservar a suíte existente (FR-025) e criar fitness tests (FR-027).

**Organization**: Setup → Foundational (mover módulo; app volta a bootar com paridade) → US1 (paridade REST/dashboard) → US2 (fronteira limpa) → US3 (eventos) → Polish.

## Convenções

- Módulo novo: `modules/TreatmentProgram/`. Namespace: `Modules\TreatmentProgram\...`.
- Preferir `git mv` para preservar histórico. Após mover, reescrever `namespace`/`use`.
- Regras PHP: `is_null()`/`! is_null()`, `empty()`/`! empty()`. Sem `declare(strict_types=1)`.
- Referência de contratos: [contracts/](contracts/). Referência de eventos: [contracts/integration-events.md](contracts/integration-events.md).

---

## Phase 1 — Setup (scaffold do módulo)

- [X] T001 Criar esqueleto de diretórios `modules/TreatmentProgram/{app/{Contracts/Public,Events,Listeners,Http/Controllers,Http/Requests,Models,Policies,Providers,Repositories,Services},config,database/{migrations,factories,seeders},routes,tests/{Feature,Unit}}` espelhando `modules/ClinicScheduling`.
- [X] T002 [P] Criar `modules/TreatmentProgram/module.json` (name `TreatmentProgram`, alias `treatmentprogram`, 1 provider `Modules\\TreatmentProgram\\Providers\\TreatmentProgramServiceProvider`) espelhando `modules/ClinicScheduling/module.json`.
- [X] T003 [P] Criar `modules/TreatmentProgram/composer.json` e `modules/TreatmentProgram/config/config.php` espelhando `ClinicScheduling`.
- [X] T004 Adicionar `"TreatmentProgram": true` em `modules_statuses.json` (não tocar `bootstrap/providers.php`).
- [X] T005 [P] Criar `modules/TreatmentProgram/app/Providers/TreatmentProgramServiceProvider.php`, `EventServiceProvider.php` e `RouteServiceProvider.php` (registrar Event+Route no provider principal; `loadViewsFrom`/`loadMigrationsFrom` conforme ClinicScheduling).
- [X] T006 [P] Criar `modules/TreatmentProgram/routes/clinic.php` com o grupo `Route::prefix('clinic')->middleware(['auth:clinic','clinic.guard'])` vazio (rotas adicionadas na Foundational).

**Checkpoint**: `php artisan about` reconhece o módulo `TreatmentProgram` habilitado.

---

## Phase 2 — Foundational (mover código; app volta a bootar com paridade)

**⚠️ BLOQUEIA todas as user stories.** Ao fim desta fase o backend sobe e o comportamento REST está preservado (ainda com imports cross-module de Model a serem limpos na US2).

### Migrations e Models

- [X] T007 `git mv` das 5 migrations de `modules/Clinic/database/migrations/` → `modules/TreatmentProgram/database/migrations/`: `2026_02_29_000003_create_clinic_treatment_plans_table.php`, `..._000004_create_clinic_treatment_plan_groups_table.php`, `..._000005_create_clinic_treatment_plan_exercises_table.php`, `2026_03_25_000001_add_patient_engagement_to_clinic_treatment_plans_table.php`, `2026_03_31_000001_create_clinic_program_drafts_table.php` (preservar timestamps/nomes; sem renomear tabelas).
- [X] T008 [P] `git mv` `TreatmentPlan.php`, `TreatmentPlanGroup.php`, `TreatmentPlanExercise.php`, `ClinicProgramDraft.php` → `modules/TreatmentProgram/app/Models/`; reescrever namespace para `Modules\TreatmentProgram\Models`; adicionar `use` FQN inline cross-module (ADR-008) para `Modules\Clinic\Models\{Clinic,ClinicUser}`, `Modules\Patient\Models\Patient`, `Modules\Admin\Models\{PhysioArea,PhysioSubarea,Exercise}`; corrigir referências internas entre os 4 models.

### Controllers, Requests, Service, Repository, Contracts, Policy

- [X] T009 [P] `git mv` `StoreTreatmentPlanRequest.php`, `UpdateTreatmentPlanRequest.php` → `modules/TreatmentProgram/app/Http/Requests/`; namespace + `use` dos models novos.
- [X] T010 [P] `git mv` `TreatmentPlanController.php`, `ProgramDraftController.php`, `SharedProgramController.php` → `modules/TreatmentProgram/app/Http/Controllers/`; namespace `Modules\TreatmentProgram\Http\Controllers`; atualizar `use` (Service interface, Requests, Models, `Modules\Pdf\Services\PdfService`). (Refactors de ProgramDraft/SharedProgram ficam na US2; aqui só mover preservando comportamento.)
- [X] T011 `git mv` `TreatmentPlanService.php` (`app/Services/`), `TreatmentPlanRepository.php` (`app/Repositories/`), `TreatmentPlanServiceInterface.php` + `TreatmentPlanRepositoryInterface.php` (`app/Contracts/`) → módulo novo; reescrever namespaces; manter, por ora, `use Modules\Admin\Models\Exercise` e `Modules\Clinic\Contracts\ActivityLoggerInterface`/`Enums\ActivityType` (limpeza do Exercise na US2; ActivityLogger permanece — R7).
- [X] T012 [P] `git mv` `TreatmentPlanPolicy.php` → `modules/TreatmentProgram/app/Policies/`; namespace + `use` do model novo.

### Seeder, Factory, Tests

- [X] T013 [P] `git mv` `TreatmentPlanSeeder.php` → `modules/TreatmentProgram/database/seeders/`; namespace; mover/criar factories necessárias em `modules/TreatmentProgram/database/factories/`.
- [X] T014 `git mv` dos testes `TreatmentPlanControllerTest.php`, `ProgramDraftControllerTest.php`, `TreatmentPlanObserverTest.php` (`tests/Feature/`) e `Unit/Policies/TreatmentPlanPolicyTest.php` → `modules/TreatmentProgram/tests/{Feature,Unit}/`; reescrever namespace `Modules\TreatmentProgram\Tests\...` e imports.

### Registro e desligamento no Clinic

- [X] T015 No `RouteServiceProvider` do TreatmentProgram, registrar `routes/clinic.php` com as rotas movidas: `clinic.treatment-plans.*` (index, pdf, show, store, update, destroy, duplicate, to-model), `clinic.program-drafts.*` (show, upsert, destroy), `clinic.programs.*` (index, show) — paths/nomes idênticos aos atuais (ver [contracts/rest-treatment-program.md](contracts/rest-treatment-program.md)).
- [X] T016 No `TreatmentProgramServiceProvider`, bind `TreatmentPlanServiceInterface→TreatmentPlanService`, `TreatmentPlanRepositoryInterface→TreatmentPlanRepository`; `Gate::policy(TreatmentPlan::class, TreatmentPlanPolicy::class)`; registrar `TreatmentPlan::observe(TreatmentPlanObserver::class)` interinamente (observer movido; convertido em evento/listener na US3).
- [X] T017 `git mv` `TreatmentPlanObserver.php` → `modules/TreatmentProgram/app/Observers/`; namespace + `use` do model novo e `Modules\WhatsApp\Jobs\SendWhatsAppMessageJob` (interino até US3).
- [X] T018 Remover do `modules/Clinic/routes/clinic.php` os blocos `treatment-plans`, `program-drafts`, `programs` e os `use` dos 3 controllers movidos.
- [X] T019 Remover do `modules/Clinic/app/Providers/ClinicServiceProvider.php` os binds de `TreatmentPlan{Service,Repository}Interface`, o `TreatmentPlan::observe(...)`, o `Gate::policy(TreatmentPlan::class, ...)` e os `use` órfãos; garantir que nada mais no Clinic importe os models movidos (exceto o dashboard, tratado na US1).
- [X] T020 Re-apontar quaisquer seeders do Clinic (`ClinicDatabaseSeeder`/`ClinicPatientDataSeeder` se referenciarem `TreatmentPlanSeeder` ou models de plano) para `Modules\TreatmentProgram\...`.

**Checkpoint**: `php artisan route:clear && php artisan config:clear && php artisan about` sobem sem erro (exceto pendência do dashboard, resolvida em T021). `route:list --path=clinic` mostra os controllers em `TreatmentProgram`.

---

## Phase 3 — User Story 1: Paridade REST + dashboard (P1) 🎯 MVP

**Goal**: Todos os endpoints e o `active_programs` do dashboard se comportam exatamente como antes; frontend não muda.

**Independent Test**: `vendor/bin/phpunit modules/TreatmentProgram/tests` verde sem relaxar asserção HTTP/JSON; `route:list --path=clinic` idêntico ao baseline; `GET /api/clinic/dashboard` retorna o mesmo `active_programs`.

- [X] T021 [US1] Criar `modules/TreatmentProgram/app/Contracts/Public/TreatmentProgramReadServiceInterface.php` e impl `app/Repositories/TreatmentProgramReadService.php` com `activeProgramsCount(int $clinicId, ?int $clinicUserId, string $monthStart, string $monthEnd): int` reproduzindo a query atual (status `active`, `whereHas('patient', activeStatus)`, janela do mês); bind no `TreatmentProgramServiceProvider` (ver [contracts/public-contracts.md](contracts/public-contracts.md) §3).
- [X] T022 [US1] Reescrever `modules/Clinic/app/Repositories/DashboardRepository.php::activeProgramsCount` para injetar `TreatmentProgramReadServiceInterface` e delegar; remover `use Modules\Clinic\Models\TreatmentPlan` do DashboardRepository (derivar `monthStart/monthEnd` do `DashboardScope` como hoje).
- [X] T023 [US1] Ajustar factories/fixtures dos testes movidos para o namespace novo e rodar `vendor/bin/phpunit modules/TreatmentProgram/tests` — garantir os 25 métodos existentes verdes (CRUD, duplicate, to-model, PDF, 404 cross-clinic, policies, rascunho).
- [X] T024 [P] [US1] Criar `tests/Architecture/TreatmentProgramRouteCompatibilityTest.php` verificando que todos os paths/nomes `clinic.treatment-plans.*`, `clinic.program-drafts.*`, `clinic.programs.*` existem, com os controllers em `Modules\TreatmentProgram\Http\Controllers` e sem duplicação no Clinic.
- [X] T025 [P] [US1] Adicionar teste Feature do dashboard garantindo `active_programs` inalterado após a extração (em `modules/TreatmentProgram/tests/Feature` ou estender teste de dashboard do Clinic).

**Checkpoint**: MVP entregável — comportamento idêntico, dashboard intacto.

---

## Phase 4 — User Story 2: Fronteira limpa (P1)

**Goal**: Todo código de prescrição em `TreatmentProgram`; sem imports privados cross-module em regra de negócio; controllers→ServiceInterface, services→RepositoryInterface.

**Independent Test**: `vendor/bin/phpunit tests/Architecture` verde (ownership, migrations, sem imports proibidos, inversão de dependência).

### Contrato Admin: catálogo de exercícios (remove import de Exercise no Service)

- [X] T026 [P] [US2] Criar `modules/Admin/app/Contracts/Public/ExerciseCatalogReadServiceInterface.php` + DTO `ExercisePrescriptionDefaults` (readonly) e impl `modules/Admin/app/Services/ExerciseCatalogReadService.php` (`findPrescriptionDefaults(int): ?ExercisePrescriptionDefaults` lendo `admin_exercises`); bind no provider do Admin (ver [contracts/public-contracts.md](contracts/public-contracts.md) §1).
- [X] T027 [US2] Refatorar `TreatmentProgram\Services\TreatmentPlanService::addExercise` para usar `ExerciseCatalogReadServiceInterface` (injetar no construtor) em vez de `Exercise::findOrFail`; remover `use Modules\Admin\Models\Exercise`; preservar comportamento de erro quando defaults `null` (R3/R11).

### Contrato Admin: catálogo de programas (remove import de AdminProgram no controller)

- [X] T028 [P] [US2] Criar `modules/Admin/app/Contracts/Public/ProgramCatalogReadServiceInterface.php` + impl `modules/Admin/app/Services/ProgramCatalogReadService.php` (`paginate(array,int)` e `findActiveWithDetails(int): ?AdminProgram`, reproduzindo filtros/eager loads/counts atuais); bind no provider do Admin (§2).
- [X] T029 [US2] Refatorar `TreatmentProgram\Http\Controllers\SharedProgramController` para injetar `ProgramCatalogReadServiceInterface`; remover `use Modules\Admin\Models\AdminProgram`; preservar shapes (`index` paginador direto; `show` `{data}` + 404).

### Refactor do ProgramDraftController (Controller não faz query)

- [X] T030 [P] [US2] Criar `ProgramDraftRepositoryInterface` + `ProgramDraftRepository` (`findByUser`, `upsert`→`[model,bool]`, `deleteByUser`, `existsForUser`) em `modules/TreatmentProgram/app/{Contracts,Repositories}` (ver [contracts/internal-contracts.md](contracts/internal-contracts.md)).
- [X] T031 [P] [US2] Criar `ProgramDraftServiceInterface` + `ProgramDraftService` (`showForUser`, `upsertForUser`, `destroyForUser`) delegando ao repositório.
- [X] T032 [US2] Refatorar `ProgramDraftController` para depender de `ProgramDraftServiceInterface` (sem `ClinicProgramDraft::...` no controller); manter validação inline atual e mesmos responses; bind Service+Repository no provider.

### Fitness tests de fronteira

- [X] T033 [US2] Estender `tests/Architecture/ModuleBoundaryTest.php` e fixtures para incluir `TreatmentProgram`: proibir em Services/Repositories/Controllers de produção imports de `Modules\Admin\Models\Exercise`, `Modules\Admin\Models\AdminProgram`, `Modules\Patient\Models\Patient`, `Modules\Media\Models\*`; permitir FQN inline em Models (ADR-008); asserir Controller→ServiceInterface e Service→RepositoryInterface.
- [X] T034 [P] [US2] Estender `tests/Architecture/ExtractionReadinessTest.php` e `ClinicScopedModuleNamingTest.php`: migrations `clinic_treatment_*`/`clinic_program_drafts` em `modules/TreatmentProgram/database/migrations` e ausentes no Clinic; nenhuma regra/rota de prescrição remanescente no Clinic.
- [X] T035 [P] [US2] Testes dos contratos públicos novos (`ExerciseCatalogReadService`, `ProgramCatalogReadService`, `TreatmentProgramReadService`) em `modules/Admin/tests` e `modules/TreatmentProgram/tests`.

**Checkpoint**: `vendor/bin/phpunit tests/Architecture` verde; nenhum import proibido.

---

## Phase 5 — User Story 3: Eventos de integração (P2)

**Goal**: 7 eventos `final readonly` afterCommit (sem Model); WhatsApp de ativação via listener de `TreatmentPlanActivated`.

**Independent Test**: `Event::fake` confirma o evento correto por caso de uso após commit, só com IDs+snapshot; listener enfileira o mesmo WhatsApp de antes.

- [X] T036 [P] [US3] Criar os 7 eventos em `modules/TreatmentProgram/app/Events/` com os payloads de [contracts/integration-events.md](contracts/integration-events.md): `TreatmentPlanCreated`, `TreatmentPlanActivated`, `TreatmentPlanCompleted`, `TreatmentPlanArchived`, `ProgramDraftCreated`, `ProgramDraftUpdated`, `ProgramDraftConvertedToTreatmentPlan` (todos `final readonly`, `version=1`, `CarbonImmutable $occurredAt`).
- [X] T037 [US3] Em `TreatmentPlanService`, despachar via `DB::afterCommit`: `TreatmentPlanCreated` no create; `TreatmentPlanActivated` quando o plano nasce/transiciona para `active` (com `patient_id`); `TreatmentPlanCompleted` na transição→`completed`; `TreatmentPlanArchived` na transição→`cancelled` (comparar `oldStatus`); `ProgramDraftConvertedToTreatmentPlan` best-effort quando o ator tem rascunho (via `ProgramDraftRepository::existsForUser`) — R8/R9.
- [X] T038 [US3] Em `ProgramDraftService::upsertForUser`, despachar `ProgramDraftCreated`/`ProgramDraftUpdated` (afterCommit) conforme `wasRecentlyCreated`.
- [X] T039 [US3] Criar `modules/TreatmentProgram/app/Listeners/SendTreatmentPlanActivationNotification.php` reagindo a `TreatmentPlanActivated`: obter paciente via `PatientServiceInterface::find` (telefone/`clinic_id`), carregar `message` do plano via repositório próprio, replicar as condições/fallback atuais e `SendWhatsAppMessageJob::dispatch(to,body)` (R6).
- [X] T040 [US3] Registrar o listener no `EventServiceProvider` do TreatmentProgram; remover `TreatmentPlan::observe(...)` do provider e **deletar** `TreatmentPlanObserver.php` (comportamento agora via evento+listener).
- [X] T041 [P] [US3] Converter `TreatmentPlanObserverTest` em teste do listener (`SendTreatmentPlanActivationNotification`) — mesmas condições de disparo/não-disparo do WhatsApp; usar `Queue::fake`.
- [X] T042 [P] [US3] Testes de eventos: `Event::fake` por caso de uso (create/activate/complete/archive; draft upsert/convert) asserindo dispatch afterCommit e payload; teste de arquitetura garantindo que nenhuma propriedade dos 7 eventos é `Eloquent\Model`.

**Checkpoint**: EDA completo; WhatsApp preservado sem observer.

---

## Phase 6 — Polish & Documentação

- [X] T043 [P] Criar `docs/adr/010-treatment-program-extraction.md`: ownership da prescrição por TreatmentProgram; paths/tabelas preservados; migrations no módulo dono; Clinic sem novas regras de prescrição; leituras de Patient/Admin/Media via ID/contrato/DTO/read model; acoplamento aceito de `ActivityLoggerInterface` (motivo + teste de contenção + plano de remoção).
- [X] T044 [P] Atualizar `docs/architecture/clinic-capability-map.md` (capability `treatment_program` → extracted) e `docs/architecture/extraction-readiness-checklist.md`.
- [X] T045 Rodar `./vendor/bin/pint` e corrigir formatação de todo o módulo.
- [X] T046 Validação final (registrar resultados): `vendor/bin/phpunit tests/Architecture`, `vendor/bin/phpunit modules/TreatmentProgram/tests`, `php artisan route:list --path=clinic`, `php artisan migrate:fresh --seed`.
- [X] T047 Smoke do dashboard: confirmar `GET /api/clinic/dashboard` (`active_programs`) e `GET /api/clinic/dashboard/activities` (feed com `program_created`/`program_completed`/`exercises_added`) inalterados.

---

## Dependencies & Order

- **Setup (T001–T006)** → antes de tudo.
- **Foundational (T007–T020)** → BLOQUEIA US1/US2/US3. App boota ao fim (com T021–T022 fechando a pendência do dashboard).
- **US1 (T021–T025)** → depende de Foundational. É o MVP. T021→T022 (contrato antes do consumidor).
- **US2 (T026–T035)** → depende de Foundational; independente de US1 (pode ir em paralelo após Foundational, mas recomendável após MVP verde).
- **US3 (T036–T042)** → depende de Foundational; T036 (eventos) antes de T037–T040; T030/T031 (ProgramDraft Service/Repo da US2) são pré-requisito de T037 (best-effort convert) e T038.
- **Polish (T043–T047)** → por último.

### Dependências entre stories

- US1 e US2 são ambas P1 e majoritariamente independentes após Foundational. US3 (P2) depende do `ProgramDraftService`/`Repository` criados na US2 (T030–T031) para os eventos de rascunho e o best-effort de conversão.

## Parallel Execution

- **Setup**: T002, T003, T005, T006 em paralelo (arquivos distintos).
- **Foundational**: T008, T009, T012, T013 em paralelo (git mv de conjuntos distintos); T007/T010/T011/T014 tocam áreas próprias.
- **US1**: T024, T025 em paralelo após T021–T023.
- **US2**: T026, T028, T030, T031 em paralelo (contratos/arquivos distintos); depois T027/T029/T032; fitness T033–T035 em paralelo ao final.
- **US3**: T036 primeiro; T041, T042 em paralelo após T037–T040.
- **Polish**: T043, T044 em paralelo.

## MVP Scope

**MVP = Setup + Foundational + US1 (T001–T025)**: prescrição totalmente migrada para `TreatmentProgram` com paridade REST e dashboard intacto. US2 endurece a fronteira (contratos públicos, fitness tests); US3 adiciona EDA. Recomenda-se entregar US1 verde antes de US2/US3.
