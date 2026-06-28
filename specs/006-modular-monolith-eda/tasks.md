# Tasks: Modular Monolith EDA

**Input**: Design documents from `specs/006-modular-monolith-eda/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/)

**Tests**: Included because the specification requires route compatibility, boundary fitness checks, event contract validation, and regression validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on incomplete tasks.
- **[Story]**: User story label from [spec.md](spec.md).
- Every task includes exact file paths.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare documentation, module skeleton, and baseline evidence before moving code.

- [X] T001 Create ADR for `ClinicFinance` physical extraction and route ownership in `docs/adr/006-clinic-finance-extraction.md`
- [X] T002 Create ADR for temporary shared writes between `Clinic` and `ClinicFinance` in `docs/adr/007-clinic-finance-temporary-shared-writes.md`
- [X] T003 Create initial `ClinicFinance` module manifest in `modules/ClinicFinance/module.json`
- [X] T004 Create initial `ClinicFinance` composer metadata in `modules/ClinicFinance/composer.json`
- [X] T005 [P] Create `ClinicFinance` route placeholder in `modules/ClinicFinance/routes/clinic.php`
- [X] T006 [P] Create `ClinicFinance` config placeholder in `modules/ClinicFinance/config/config.php`
- [X] T007 [P] Create `ClinicFinance` provider skeleton in `modules/ClinicFinance/app/Providers/ClinicFinanceServiceProvider.php`
- [X] T008 [P] Create `ClinicFinance` route provider skeleton in `modules/ClinicFinance/app/Providers/RouteServiceProvider.php`
- [X] T009 [P] Create `ClinicFinance` event provider skeleton in `modules/ClinicFinance/app/Providers/EventServiceProvider.php`
- [X] T010 Capture baseline finance route list output notes in `specs/006-modular-monolith-eda/route-baseline.md`
- [X] T011 Capture baseline backend test status notes in `specs/006-modular-monolith-eda/test-baseline.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish module boundaries, service registration, and validation scaffolding required by all user stories.

**Critical**: No user story work should begin until this phase is complete.

- [X] T012 Register `ClinicFinance` service provider loading in `bootstrap/providers.php`
- [X] T013 Add module boundary whitelist structure in `tests/Architecture/fixtures/module-boundary-whitelist.php`
- [X] T014 Create production-code dependency scanner test in `tests/Architecture/ModuleBoundaryTest.php`
- [X] T015 Add `ClinicFinance` namespace and forbidden dependency expectations to `tests/Architecture/ModuleBoundaryTest.php`
- [X] T016 Create public DTO directory and README for cross-module contracts in `modules/ClinicFinance/app/DTO/README.md`
- [X] T017 Create internal contracts directory README distinguishing service contracts from repositories in `modules/ClinicFinance/app/Contracts/README.md`
- [X] T018 Create finance route compatibility test base helper in `modules/ClinicFinance/tests/Feature/FinanceRouteCompatibilityTest.php`
- [X] T019 Add temporary test/factory/seeder whitelist entries with reasons in `tests/Architecture/fixtures/module-boundary-whitelist.php`
- [X] T020 Verify `vendor/bin/phpunit --filter=ModuleBoundaryTest` fails for a synthetic prohibited production import documented in `specs/006-modular-monolith-eda/test-baseline.md`

**Checkpoint**: Foundation ready. Module skeleton exists, boundary test framework exists, and route compatibility test scaffolding exists.

---

## Phase 3: User Story 1 - Preserve Business Flows While Reducing Coupling (Priority: P1) - MVP

**Goal**: Move clinic finance behavior to `ClinicFinance` while preserving public `/clinic/finances/*` route paths, request contracts, response envelopes, auth behavior, and table names.

**Independent Test**: Run `php artisan route:list --path=clinic/finances` and `vendor/bin/phpunit --filter=FinanceRouteCompatibilityTest`; paths and JSON/file contracts must match [contracts/clinic-finance-rest.md](contracts/clinic-finance-rest.md).

### Tests for User Story 1

- [X] T021 [P] [US1] Add route parity assertions for all `/clinic/finances/*` paths in `modules/ClinicFinance/tests/Feature/FinanceRouteCompatibilityTest.php`
- [X] T022 [P] [US1] Add transaction JSON envelope tests in `modules/ClinicFinance/tests/Feature/FinancialTransactionControllerTest.php`
- [X] T023 [P] [US1] Add category JSON envelope tests in `modules/ClinicFinance/tests/Feature/FinancialCategoryControllerTest.php`
- [X] T024 [P] [US1] Add summary and report JSON envelope tests in `modules/ClinicFinance/tests/Feature/FinancialReportControllerTest.php`
- [X] T025 [P] [US1] Add export compatibility tests for csv/xlsx/pdf and empty export errors in `modules/ClinicFinance/tests/Feature/FinancialExportControllerTest.php`

### Implementation for User Story 1

- [X] T026 [P] [US1] Move `FinancialTransactionType`, `FinancialTransactionStatus`, `FinancialCategoryOrigin`, and `PaymentMethod` enums from `modules/Clinic/app/Enums/` to `modules/ClinicFinance/app/Enums/`
- [X] T027 [P] [US1] Move `FinancialCategory`, `FinancialTransaction`, and `PeriodOpeningBalance` models from `modules/Clinic/app/Models/` to `modules/ClinicFinance/app/Models/` while preserving table names
- [X] T028 [P] [US1] Move financial policies from `modules/Clinic/app/Policies/FinancialCategoryPolicy.php` and `modules/Clinic/app/Policies/FinancialTransactionPolicy.php` to `modules/ClinicFinance/app/Policies/`
- [X] T029 [P] [US1] Move financial FormRequests from `modules/Clinic/app/Http/Requests/` to `modules/ClinicFinance/app/Http/Requests/`
- [X] T030 [US1] Move financial repository interfaces from `modules/Clinic/app/Contracts/` to `modules/ClinicFinance/app/Contracts/`
- [X] T031 [US1] Move financial repositories from `modules/Clinic/app/Repositories/` to `modules/ClinicFinance/app/Repositories/`
- [X] T032 [US1] Move finance services from `modules/Clinic/app/Services/FinancialTransactionService.php`, `modules/Clinic/app/Services/FinancialCategoryService.php`, `modules/Clinic/app/Services/FinanceSummaryService.php`, and `modules/Clinic/app/Services/FinanceReportService.php` to `modules/ClinicFinance/app/Services/`
- [X] T033 [US1] Move finance exporters from `modules/Clinic/app/Services/Export/` to `modules/ClinicFinance/app/Services/Export/`
- [X] T034 [US1] Move finance controllers from `modules/Clinic/app/Http/Controllers/Financial*Controller.php` to `modules/ClinicFinance/app/Http/Controllers/`
- [X] T035 [US1] Bind `ClinicFinance` repositories and services in `modules/ClinicFinance/app/Providers/ClinicFinanceServiceProvider.php`
- [X] T036 [US1] Register `ClinicFinance` financial policies in `modules/ClinicFinance/app/Providers/ClinicFinanceServiceProvider.php`
- [X] T037 [US1] Define the same `/clinic/finances/*` routes in `modules/ClinicFinance/routes/clinic.php`
- [X] T038 [US1] Disable legacy finance route declarations in `modules/Clinic/routes/clinic.php` after `ClinicFinance` route parity passes
- [X] T039 [US1] Update all finance namespaces imported by moved classes under `modules/ClinicFinance/app/`
- [X] T040 [US1] Update finance factories and seeders namespace references in `modules/Clinic/database/factories/` and `modules/Clinic/database/seeders/`
- [X] T041 [US1] Move finance feature tests from `modules/Clinic/tests/Feature/Finances/` to `modules/ClinicFinance/tests/Feature/`
- [X] T042 [US1] Verify current finance migrations remain named under `modules/Clinic/database/migrations/*clinic_financial*.php` and document ownership transfer in `docs/adr/006-clinic-finance-extraction.md`
- [X] T043 [US1] Run `php artisan route:list --path=clinic/finances` and record unchanged paths in `specs/006-modular-monolith-eda/route-baseline.md`
- [X] T044 [US1] Run `vendor/bin/phpunit --filter=FinanceRouteCompatibilityTest` and record result in `specs/006-modular-monolith-eda/test-baseline.md`

**Checkpoint**: User Story 1 is complete when `ClinicFinance` serves the same finance routes and finance regression tests pass without frontend changes.

---

## Phase 4: User Story 2 - React to Business Facts Through Events (Priority: P2)

**Goal**: Publish stable, versionable `ClinicFinance` events from write operations without exposing Eloquent models.

**Independent Test**: Trigger create/update/delete/category/opening-balance operations and verify events contain only IDs, clinic context, minimal snapshots, version, and `occurredAt`.

### Tests for User Story 2

- [X] T045 [P] [US2] Add event payload unit tests for transaction events in `modules/ClinicFinance/tests/Unit/Events/FinancialTransactionEventsTest.php`
- [X] T046 [P] [US2] Add event payload unit tests for category and opening-balance events in `modules/ClinicFinance/tests/Unit/Events/FinancialCategoryAndBalanceEventsTest.php`
- [X] T047 [P] [US2] Add service dispatch tests for finance transaction writes in `modules/ClinicFinance/tests/Unit/FinancialTransactionServiceEventTest.php`
- [X] T048 [P] [US2] Add service dispatch tests for category and opening-balance writes in `modules/ClinicFinance/tests/Unit/FinancialCategoryAndBalanceEventTest.php`

### Implementation for User Story 2

- [X] T049 [P] [US2] Create `FinancialTransactionRecorded` event in `modules/ClinicFinance/app/Events/FinancialTransactionRecorded.php`
- [X] T050 [P] [US2] Create `FinancialTransactionUpdated` event in `modules/ClinicFinance/app/Events/FinancialTransactionUpdated.php`
- [X] T051 [P] [US2] Create `FinancialTransactionDeleted` event in `modules/ClinicFinance/app/Events/FinancialTransactionDeleted.php`
- [X] T052 [P] [US2] Create `FinancialCategoryCreated` event in `modules/ClinicFinance/app/Events/FinancialCategoryCreated.php`
- [X] T053 [P] [US2] Create `OpeningBalanceUpdated` event in `modules/ClinicFinance/app/Events/OpeningBalanceUpdated.php`
- [X] T054 [US2] Dispatch transaction events after commit from `modules/ClinicFinance/app/Services/FinancialTransactionService.php`
- [X] T055 [US2] Dispatch category events after commit from `modules/ClinicFinance/app/Services/FinancialCategoryService.php`
- [X] T056 [US2] Dispatch opening balance events after commit from `modules/ClinicFinance/app/Services/FinanceSummaryService.php`
- [X] T057 [US2] Register event discovery or explicit listener mapping in `modules/ClinicFinance/app/Providers/EventServiceProvider.php`
- [X] T058 [US2] Document event payload version rules in `modules/ClinicFinance/app/Events/README.md`
- [X] T059 [US2] Run `vendor/bin/phpunit --filter=Event` and record result in `specs/006-modular-monolith-eda/test-baseline.md`

**Checkpoint**: User Story 2 is complete when finance write services publish stable event payloads and all event tests pass.

---

## Phase 5: User Story 3 - Split Clinic Responsibilities Into Clear Business Capabilities (Priority: P3)

**Goal**: Establish clinic-scoped capability mapping and naming rules so future modules such as `ClinicScheduling`, `ClinicCare`, and `ClinicIdentity` can be extracted consistently.

**Independent Test**: Review the capability map and verify that new clinic-related work has one owning clinic-scoped module and an approved collaboration path.

### Tests for User Story 3

- [X] T060 [P] [US3] Add capability naming validation test in `tests/Architecture/ClinicScopedModuleNamingTest.php`
- [X] T061 [P] [US3] Add capability ownership fixture for current clinic areas in `tests/Architecture/fixtures/clinic-capability-map.php`

### Implementation for User Story 3

- [X] T062 [US3] Create clinic capability map document in `docs/architecture/clinic-capability-map.md`
- [X] T063 [US3] Document future `ClinicScheduling`, `ClinicCare`, `ClinicIdentity`, and `ClinicDashboard` boundaries in `docs/architecture/clinic-capability-map.md`
- [X] T064 [US3] Add naming rules for clinic-scoped modules to `docs/architecture/module-boundary-rules.md`
- [X] T065 [US3] Add `ClinicFinance` ownership and future module candidates to `tests/Architecture/fixtures/clinic-capability-map.php`
- [X] T066 [US3] Update `tests/Architecture/ModuleBoundaryTest.php` to read clinic capability ownership from `tests/Architecture/fixtures/clinic-capability-map.php`
- [X] T067 [US3] Record `ClinicFinance` as the first extracted capability in `docs/adr/006-clinic-finance-extraction.md`

**Checkpoint**: User Story 3 is complete when capability ownership is documented and enforceable by architecture tests.

---

## Phase 6: User Story 4 - Measure Extraction Readiness (Priority: P4)

**Goal**: Provide objective checks showing whether `ClinicFinance` and future modules are ready for microservice extraction later.

**Independent Test**: Run extraction-readiness checks and receive a clear list of remaining dependencies, contracts, events, transactions, and operational gaps.

### Tests for User Story 4

- [X] T068 [P] [US4] Add extraction readiness checklist test in `tests/Architecture/ExtractionReadinessTest.php`
- [X] T069 [P] [US4] Add fixture for extraction readiness criteria in `tests/Architecture/fixtures/extraction-readiness.php`

### Implementation for User Story 4

- [X] T070 [US4] Create extraction readiness checklist in `docs/architecture/extraction-readiness-checklist.md`
- [X] T071 [US4] Add `ClinicFinance` readiness assessment section to `docs/architecture/extraction-readiness-checklist.md`
- [X] T072 [US4] Add criteria for data ownership, public contracts, events, idempotency, transactions, outbox readiness, and observability to `tests/Architecture/fixtures/extraction-readiness.php`
- [X] T073 [US4] Update `tests/Architecture/ExtractionReadinessTest.php` to fail when required readiness criteria are missing for `ClinicFinance`
- [X] T074 [US4] Document deferred distributed concerns for future outbox/inbox in `docs/architecture/extraction-readiness-checklist.md`
- [X] T075 [US4] Run `vendor/bin/phpunit --filter=ExtractionReadinessTest` and record result in `specs/006-modular-monolith-eda/test-baseline.md`

**Checkpoint**: User Story 4 is complete when `ClinicFinance` has a measurable extraction-readiness assessment and guard test.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the whole migration, clean up temporary code, and update implementation notes.

- [X] T076 [P] Update `specs/006-modular-monolith-eda/quickstart.md` with final validation command outcomes
- [X] T077 [P] Update `specs/006-modular-monolith-eda/contracts/clinic-finance-rest.md` if implementation reveals compatible response details that should be documented
- [X] T078 [P] Update `specs/006-modular-monolith-eda/contracts/module-boundaries.md` with the final whitelist file location
- [X] T079 [P] Update `specs/006-modular-monolith-eda/contracts/events.md` with final event namespace references
- [X] T080 Remove expired temporary shared-write notes from `docs/adr/007-clinic-finance-temporary-shared-writes.md` once `ClinicFinance` is exclusive owner
- [X] T081 Run `vendor/bin/phpunit --filter=Finances` and record final result in `specs/006-modular-monolith-eda/test-baseline.md`
- [X] T082 Run `vendor/bin/phpunit --filter=ModuleBoundaryTest` and record final result in `specs/006-modular-monolith-eda/test-baseline.md`
- [X] T083 Run `vendor/bin/phpunit --filter=ExtractionReadinessTest` and record final result in `specs/006-modular-monolith-eda/test-baseline.md`
- [X] T084 Run `./vendor/bin/pint` and record formatting result in `specs/006-modular-monolith-eda/test-baseline.md`
- [X] T085 Run `php artisan route:list --path=clinic/finances` and confirm final route owner notes in `specs/006-modular-monolith-eda/route-baseline.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup; blocks user stories.
- **US1 (Phase 3)**: Depends on Foundational; MVP scope.
- **US2 (Phase 4)**: Depends on US1 service/module ownership.
- **US3 (Phase 5)**: Depends on Foundational; can run alongside US1 after module naming is stable, but should be finalized after `ClinicFinance` ownership is known.
- **US4 (Phase 6)**: Depends on US1 and US2 for a meaningful `ClinicFinance` readiness assessment.
- **Polish (Phase 7)**: Depends on selected user stories being complete.

### User Story Dependencies

- **US1**: Independent MVP after Foundational.
- **US2**: Builds on `ClinicFinance` services created by US1.
- **US3**: Mostly independent after Foundational, but references US1 as the first extracted module.
- **US4**: Requires US1 and US2 to assess readiness honestly.

### Parallel Opportunities

- Setup skeleton tasks T005-T009 can run in parallel.
- Foundational documentation/readme tasks T016-T017 can run in parallel with test scaffolding T013-T015.
- US1 route/controller tests T021-T025 can run in parallel.
- US1 class move groups T026-T029 can run in parallel before service binding.
- US2 event class tasks T049-T053 can run in parallel.
- US3 documentation tasks T062-T064 can run in parallel with fixture tasks T060-T061.
- US4 fixture/checklist tasks T068-T072 can run in parallel.

## Parallel Example: User Story 1

```text
Task: "T021 [P] [US1] Add route parity assertions for all `/clinic/finances/*` paths in `modules/ClinicFinance/tests/Feature/FinanceRouteCompatibilityTest.php`"
Task: "T022 [P] [US1] Add transaction JSON envelope tests in `modules/ClinicFinance/tests/Feature/FinancialTransactionControllerTest.php`"
Task: "T023 [P] [US1] Add category JSON envelope tests in `modules/ClinicFinance/tests/Feature/FinancialCategoryControllerTest.php`"
Task: "T024 [P] [US1] Add summary and report JSON envelope tests in `modules/ClinicFinance/tests/Feature/FinancialReportControllerTest.php`"
Task: "T025 [P] [US1] Add export compatibility tests for csv/xlsx/pdf and empty export errors in `modules/ClinicFinance/tests/Feature/FinancialExportControllerTest.php`"
```

## Parallel Example: User Story 2

```text
Task: "T049 [P] [US2] Create `FinancialTransactionRecorded` event in `modules/ClinicFinance/app/Events/FinancialTransactionRecorded.php`"
Task: "T050 [P] [US2] Create `FinancialTransactionUpdated` event in `modules/ClinicFinance/app/Events/FinancialTransactionUpdated.php`"
Task: "T051 [P] [US2] Create `FinancialTransactionDeleted` event in `modules/ClinicFinance/app/Events/FinancialTransactionDeleted.php`"
Task: "T052 [P] [US2] Create `FinancialCategoryCreated` event in `modules/ClinicFinance/app/Events/FinancialCategoryCreated.php`"
Task: "T053 [P] [US2] Create `OpeningBalanceUpdated` event in `modules/ClinicFinance/app/Events/OpeningBalanceUpdated.php`"
```

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational boundary scaffolding.
3. Complete Phase 3 `ClinicFinance` route-preserving extraction.
4. Stop and validate with `php artisan route:list --path=clinic/finances` and `vendor/bin/phpunit --filter=FinanceRouteCompatibilityTest`.

### Incremental Delivery

1. Deliver US1 so the frontend keeps working with `ClinicFinance` as route owner.
2. Deliver US2 so finance write facts publish stable events.
3. Deliver US3 so future clinic-scoped module extraction has documented naming and ownership rules.
4. Deliver US4 so `ClinicFinance` has measurable extraction-readiness gates.

### Notes

- Keep existing table/view names; do not rename `clinic_financial_*`.
- Keep existing public REST paths; do not change `/clinic/finances/*`.
- Do not change frontend files under `resources/js/`.
- Treat `RepositoryInterface` files as internal module contracts, not public cross-module APIs.
- Listener consequences must call services in their own module.
- Temporary shared writes require ADR coverage and a removal task.
