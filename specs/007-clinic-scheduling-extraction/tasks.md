---
description: "Task list — Clinic Scheduling Extraction"
---

# Tasks: Clinic Scheduling Extraction

**Input**: Design documents from `specs/007-clinic-scheduling-extraction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluídos — fitness tests são obrigatórios (enunciado) e os testes de agendamento existentes são movidos com o código.

**Organization**: Agrupado por user story. Nota: esta é uma extração física — US1 entrega a paridade funcional (a app sobe e o contrato REST é idêntico); US2 garante a fronteira limpa via fitness tests; US3 prova a integração orientada a eventos. Convenções obrigatórias em todo código: relações cross-module por **FQN inline** (sem `use`), `is_null()`/`! is_null()`, `empty()`/`! empty()`, sem `declare(strict_types=1)`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold do módulo `ClinicScheduling` espelhando `modules/ClinicFinance`.

- [x] T001 Criar esqueleto de pastas em `modules/ClinicScheduling/` (`app/{Contracts,Contracts/Public,Enums,Events,Http/Controllers,Http/Requests,Jobs,Models,Policies,Providers,Repositories,Services}`, `config`, `database/{factories,migrations,seeders}`, `routes`, `tests/{Feature,Unit}`)
- [x] T002 [P] Criar `modules/ClinicScheduling/composer.json` (PSR-4 `Modules\ClinicScheduling\` → `app/`, factories, seeders, tests; `extra.laravel.providers: []`) espelhando `modules/ClinicFinance/composer.json`
- [x] T003 [P] Criar `modules/ClinicScheduling/module.json` (`name: ClinicScheduling`, `alias: clinicscheduling`, `providers: [Modules\ClinicScheduling\Providers\ClinicSchedulingServiceProvider]`)
- [x] T004 [P] Criar `modules/ClinicScheduling/config/config.php` (`name => 'ClinicScheduling'`) espelhando ClinicFinance
- [x] T005 Habilitar o módulo em `modules_statuses.json` (`"ClinicScheduling": true`) e rodar `composer dump-autoload`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Núcleo de dados/contratos que toda story precisa. NÃO inclui ainda o wiring de rotas/serviço.

**⚠️ CRITICAL**: Bloqueia US1, US2 e US3.

- [x] T006 [P] Mover enum para `modules/ClinicScheduling/app/Enums/AppointmentStatus.php` (namespace `Modules\ClinicScheduling\Enums`; conteúdo/casos/métodos inalterados)
- [x] T007 Criar `modules/ClinicScheduling/app/Models/Appointment.php` (namespace novo; `$table='clinic_appointments'`; relações `clinic`/`clinicUser`/`patient` por **FQN inline** `\Modules\Clinic\Models\Clinic::class` etc.; enum import → `Modules\ClinicScheduling\Enums\AppointmentStatus`; factory → nova; scopes/constantes preservados) — depende de T006
- [x] T008 `git mv` da migration `modules/Clinic/database/migrations/2026_06_16_000001_create_clinic_appointments_table.php` → `modules/ClinicScheduling/database/migrations/` (conteúdo inalterado; conferir case do diretório antes — ver memória git-case-sensitivity)
- [x] T009 [P] Mover `AppointmentFactory` → `modules/ClinicScheduling/database/factories/AppointmentFactory.php` (namespace `Modules\ClinicScheduling\Database\Factories`; `$model = Appointment::class` novo; `use` de Clinic/Patient permitido em factories pelo whitelist non_production)
- [x] T010 [P] Criar contratos internos `modules/ClinicScheduling/app/Contracts/AppointmentRepositoryInterface.php` e `AppointmentServiceInterface.php` (assinaturas de [contracts/internal-contracts.md](contracts/internal-contracts.md); `listForUser($user, ...)` sem type-hint de ClinicUser)
- [x] T011 [US3] Criar as 4 classes de evento `final readonly` em `modules/ClinicScheduling/app/Events/` (`AppointmentScheduled`, `AppointmentRescheduled`, `AppointmentCancelled`, `AppointmentCompleted`) conforme [contracts/integration-events.md](contracts/integration-events.md)
- [x] T012 [P] Criar contrato público `modules/ClinicScheduling/app/Contracts/Public/SchedulingReadServiceInterface.php` conforme [contracts/public-contracts.md](contracts/public-contracts.md)
- [x] T013 Criar `modules/ClinicScheduling/app/Repositories/AppointmentRepository.php` (implements interface interna; namespace novo; `listForCalendar` preservado) — depende de T007, T010

**Checkpoint**: Model, enum, migration, factory, contratos e eventos existem no módulo novo.

---

## Phase 3: User Story 1 - Frontend continua funcionando sem mudanças (Priority: P1) 🎯 MVP

**Goal**: A app sobe e os endpoints REST de agendamento respondem nos mesmos paths/shapes, agora servidos por `ClinicScheduling`, com comportamento idêntico (status, visibilidade, multi-tenant, Google sync, activity log, notificação).

**Independent Test**: `php artisan route:list --path=clinic/appointments` mostra owners em `Modules\ClinicScheduling`; `vendor/bin/phpunit modules/ClinicScheduling/tests/Feature` verde; app boota.

### Implementation for User Story 1

- [x] T014 [US1] Criar `modules/ClinicScheduling/app/Services/AppointmentService.php` (implements interface; `create/update/updateStatus/cancel/listForUser` preservados; **remover** chamadas diretas a `SyncAppointmentToGoogleJob` e `ActivityLoggerInterface`; despachar os 4 eventos via `DB::afterCommit(fn () => Event::dispatch($event))`; `AppointmentRescheduled` em qualquer update; manter dispatch da notificação) — depende de T011, T013
- [x] T015 [US1] Mover `AppointmentScheduledNotificationJob` → `modules/ClinicScheduling/app/Jobs/` (namespace novo; import do Model → ClinicScheduling; `->afterCommit()` preservado)
- [x] T016 [P] [US1] Criar `modules/ClinicScheduling/app/Services/SchedulingReadService.php` implementando `SchedulingReadServiceInterface` (lógica de timezone + `status != cancelled` migrada de DashboardRepository/OccupancyRateService; usa AppointmentRepository) — depende de T012, T013
- [x] T017 [P] [US1] Mover `AppointmentPolicy` → `modules/ClinicScheduling/app/Policies/AppointmentPolicy.php` (type-hint `$user` sem `use ClinicUser`; usar `\Modules\Clinic\Models\Appointment` removido — referenciar `Appointment` do próprio módulo)
- [x] T018 [P] [US1] Mover os 3 FormRequests → `modules/ClinicScheduling/app/Http/Requests/` (`Store`/`Update`/`UpdateStatus`AppointmentRequest; **remover** `use Modules\Clinic\Models\ClinicUser` e `use Modules\Patient\Models\Patient` — usar `Rule::exists` + FQN inline/`DB::table` no `withValidator`; enum import → ClinicScheduling)
- [x] T019 [US1] Mover `AppointmentController` → `modules/ClinicScheduling/app/Http/Controllers/AppointmentController.php` (namespace novo; imports Service/Requests/Model → ClinicScheduling; lógica/authorize/`authorizeClinic` preservados) — depende de T014, T017, T018
- [x] T020 [US1] Criar `modules/ClinicScheduling/routes/clinic.php` com o grupo `prefix('clinic')->middleware(['auth:clinic','clinic.guard'])` contendo **apenas** o sub-grupo `appointments` (index/store/show/update/status/cancel; names `clinic.appointments.*`) — depende de T019
- [x] T021 [P] [US1] Criar `modules/ClinicScheduling/app/Providers/RouteServiceProvider.php` (map `prefix('api')->name('api.')` → `routes/clinic.php`) espelhando ClinicFinance
- [x] T022 [P] [US1] Criar `modules/ClinicScheduling/app/Providers/EventServiceProvider.php` (`$shouldDiscoverEvents = true`)
- [x] T023 [US1] Criar `modules/ClinicScheduling/app/Providers/ClinicSchedulingServiceProvider.php` (bindings Repository/Service/SchedulingReadService; `loadMigrationsFrom`; `Gate::policy(Appointment::class, AppointmentPolicy::class)`; registrar Event/Route providers; registerConfig/registerViews) — depende de T021, T022
- [x] T024 [US1] Remover o grupo `appointments` e o `use ...AppointmentController` de `modules/Clinic/routes/clinic.php` (sem rota de agendamento duplicada)
- [x] T025 [US1] Adaptar `modules/Clinic/app/Repositories/DashboardRepository.php` para ler via `SchedulingReadServiceInterface` (injetar no construtor; `appointmentsTodayCount`/`upcomingAppointmentsToday` delegam; remover `use` de Appointment/AppointmentStatus e o helper `todaysAppointments`) — depende de T016
- [x] T026 [US1] Adaptar `modules/Clinic/app/Services/OccupancyRateService.php` para usar `occupancyIntervals(...)` do contrato público (remover `use` de Appointment/AppointmentStatus) — depende de T016
- [x] T027 [P] [US1] Re-apontar imports em GoogleCalendar (`SyncAppointmentToGoogleJob`, `PullGoogleCalendarJob`, `GoogleCalendarService`, `GoogleCalendarServiceInterface`) de `Modules\Clinic\Models\Appointment` / `Modules\Clinic\Enums\AppointmentStatus` → `Modules\ClinicScheduling\...`
- [x] T028 [US1] Re-apontar `modules/Clinic/database/seeders/DashboardDemoSeeder.php` para a nova `AppointmentFactory` (import → ClinicScheduling) e ajustar uso, preservando o seed de agendamento
- [x] T029 [US1] Mover testes Feature/Unit de agendamento de `modules/Clinic/tests/**` → `modules/ClinicScheduling/tests/**` (`AppointmentIndexVisibilityTest`, `AppointmentSetupTest`, `AppointmentFoundationTest`, `AppointmentStoreTest`, `AppointmentUpdateStatusTest`, `AppointmentAuthorizationTest`, `AppointmentServiceCreateTest`, `AppointmentStatusTest`, `OccupancyRateServiceTest`) ajustando namespaces/`use` para `Modules\ClinicScheduling`

**Checkpoint**: REST de agendamento funcional via ClinicScheduling; app boota; testes Feature passam (Google sync/activity log entram via listeners na US3 — ordenar US3 antes da validação final).

---

## Phase 4: User Story 2 - Agendamento é um módulo com fronteira limpa (Priority: P1)

**Goal**: `Clinic` não contém mais código/rota/regra de agendamento; fitness tests provam ownership e ausência de imports privados cross-module.

**Independent Test**: `vendor/bin/phpunit tests/Architecture` verde; `grep -rn "Appointment" modules/Clinic/app` sem regra de agendamento.

- [x] T030 [US2] Deletar de `modules/Clinic` os arquivos de agendamento remanescentes: `app/Models/Appointment.php`, `app/Enums/AppointmentStatus.php`, `app/Services/AppointmentService.php`, `app/Repositories/AppointmentRepository.php`, `app/Policies/AppointmentPolicy.php`, `app/Contracts/Appointment{Repository,Service}Interface.php`, `app/Http/Controllers/AppointmentController.php`, `app/Http/Requests/*Appointment*`, `app/Jobs/AppointmentScheduledNotificationJob.php`
- [x] T031 [US2] Limpar `modules/Clinic/app/Providers/ClinicServiceProvider.php` (remover bindings `Appointment{Repository,Service}Interface`, `use` e `Gate::policy(Appointment::class, ...)`)
- [x] T032 [US2] Estender `tests/Architecture/ModuleBoundaryTest.php` para escanear também `modules/ClinicScheduling/app` (novo método espelhando `findClinicFinanceViolations`; assert zero violações)
- [x] T033 [P] [US2] Flipar `scheduling.status` para `extracted` em `tests/Architecture/fixtures/clinic-capability-map.php` e alinhar `owns` (`appointments`) e `routes` (`/api/clinic/appointments/*`)
- [x] T034 [P] [US2] Estender `tests/Architecture/ExtractionReadinessTest.php` com `test_clinic_scheduling_migrations_live_in_the_owner_module` (glob `*clinic_appointments*` ausente em Clinic, presente em ClinicScheduling) e assert dos readiness criteria de ClinicScheduling
- [x] T035 [P] [US2] Adicionar bloco `ClinicScheduling` em `tests/Architecture/fixtures/extraction-readiness.php` (mesmos `required_criteria`, com evidence/next_step)
- [x] T036 [US2] Criar `modules/ClinicScheduling/tests/Feature/SchedulingRouteCompatibilityTest.php` espelhando `FinanceRouteCompatibilityTest` (URIs `api/clinic/appointments*`, métodos esperados, owners em `Modules\ClinicScheduling\Http\Controllers\Appointment`)

**Checkpoint**: `tests/Architecture` verde; nenhuma rota/código de agendamento em Clinic.

---

## Phase 5: User Story 3 - Integrações reagem a eventos de agendamento (Priority: P2)

**Goal**: GoogleCalendar e ActivityLog reagem aos eventos; cada caso de uso despacha o evento correto após o commit, com snapshot mínimo e sem Model.

**Independent Test**: testes unitários de eventos verdes; GoogleCalendar/ActivityLog tests verdes.

- [x] T037 [P] [US3] Criar listener `modules/GoogleCalendar/app/Listeners/SyncSchedulingToGoogle.php` (Scheduled/Rescheduled → `SyncAppointmentToGoogleJob` upsert se `isGoogleConnected()`; Cancelled → delete com `google_event_id`) preservando o comportamento atual de `pushToGoogle`/cancel
- [x] T038 [P] [US3] Criar listener `modules/Clinic/app/Listeners/RecordSchedulingActivity.php` (Scheduled/Completed/Cancelled → `ActivityLogger->log(...)` com o `ActivityType` e descrição atuais; subject = Appointment de ClinicScheduling)
- [x] T039 [US3] Criar testes unitários de eventos em `modules/ClinicScheduling/tests/Unit/Events/` (espelhar `FinancialTransactionEventsTest`): cada caso de uso despacha o evento após commit, com IDs+snapshot mínimo, sem instância de Model — depende de T014
- [x] T040 [US3] Ajustar/mover testes de GoogleCalendar afetados (`SyncAppointmentToGoogleJobTest` e Feature) para refletir o disparo via listener e imports de `Modules\ClinicScheduling`

**Checkpoint**: comportamento de integração preservado via EDA; eventos validados.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T041 [P] Criar `docs/adr/008-clinic-scheduling-extraction.md` (espelhar ADR-006: contexto, decisão, consequências, regras a preservar, extração futura)
- [x] T042 [P] Atualizar `docs/architecture/clinic-capability-map.md` (scheduling → extracted, owns/rotas)
- [x] T043 [P] Adicionar seção `ClinicScheduling` em `docs/architecture/extraction-readiness-checklist.md` (ready/partial/deferred, incluindo o débito de GoogleCalendar pull e read model)
- [x] T044 Rodar `./vendor/bin/pint` e corrigir estilo
- [x] T045 Rodar `vendor/bin/phpunit tests/Architecture` e `vendor/bin/phpunit modules/ClinicScheduling/tests` — todos verdes
- [x] T046 Rodar `php artisan route:list --path=clinic` (sem duplicadas; owners corretos) e `php artisan migrate:fresh --seed` (sobe e popula)
- [x] T047 Rodar `composer run test` (regressão completa: GoogleCalendar, Dashboard, Clinic) e registrar resultados no quickstart

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: sem dependências.
- **Foundational (P2)**: depende de Setup. Bloqueia US1/US2/US3.
- **US1 (P3)**: depende de Foundational. É o MVP funcional.
- **US2 (P4)**: depende de US1 (não dá para deletar o código antigo antes de mover/wirar o novo).
- **US3 (P5)**: depende de US1 (service/eventos existem). **Deve completar antes da validação final (T045–T047)** para paridade de comportamento (Google sync + activity log).
- **Polish (P6)**: depende de US1+US2+US3.

### Within Stories

- T007 dep T006; T013 dep T007+T010; T014 dep T011+T013; T016 dep T012+T013; T019 dep T014+T017+T018; T020 dep T019; T023 dep T021+T022; T025/T026 dep T016; T039 dep T014.

### Parallel Opportunities

- Setup: T002/T003/T004 [P].
- Foundational: T006/T009/T010/T012 [P] (T007/T013 sequenciais).
- US1: T016/T017/T018 [P]; T021/T022 [P]; T027 [P].
- US2: T033/T034/T035 [P].
- US3: T037/T038 [P].
- Polish: T041/T042/T043 [P].

---

## Implementation Strategy

### MVP (US1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → app boota com REST idêntico.
   **STOP & VALIDATE**: `route:list` + Feature tests.

### Incremental

1. US1 (move funcional) → 2. **US3** (listeners/eventos para paridade total) → 3. US2 (fitness/cleanup) → 4. Polish/validação.

> Observação de ordenação prática: embora US2 seja P1 na spec, tecnicamente US3 (listeners) precisa estar pronto antes da regressão final para preservar Google sync e activity log. Recomendado: US1 → US3 → US2 → Polish.

---

## Notes

- [P] = arquivos diferentes, sem dependência mútua.
- Toda relação cross-module por FQN inline; nunca `use Modules\X\Models\...` em produção de ClinicScheduling.
- Não renomear `clinic_appointments`; não mudar paths/shapes REST.
- Commit após cada task ou grupo lógico.
