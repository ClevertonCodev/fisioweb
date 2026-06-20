---
description: "Task list for Clinic Finances feature implementation"
---

# Tasks: Clinic Finances

**Input**: Design documents from `/specs/004-clinic-finances/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/finances-api.md, research.md, quickstart.md

**Tests**: INCLUDED — the plan (§Testing) and quickstart (§11) explicitly require PHPUnit (`modules/Clinic/tests/{Feature,Unit}/Finances/`) and Vitest (`resources/js/test/finances/`) suites.

**Organization**: Tasks grouped by user story (P1 → P3) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1–US5); omitted for Setup/Foundational/Polish

## Path Conventions

- Backend module: `modules/Clinic/app/...`, `modules/Clinic/database/...`, `modules/Clinic/routes/...`, `modules/Clinic/tests/...`
- Frontend SPA: `resources/js/{domain,application,infrastructure,pages,components,routes}/...`, tests in `resources/js/test/finances/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and shared dependencies

- [ ] T001 Add XLSX dependency: run `composer require openspout/openspout:^4` and confirm it lands in `composer.json`/`composer.lock`
- [ ] T002 [P] Promote chart setup for reuse: move `resources/js/components/clinic/dashboard/chart-setup.ts` to `resources/js/components/charts/chart-setup.ts` and update all importers (Dashboard) to the new path
- [ ] T003 [P] Create test folders: `modules/Clinic/tests/Feature/Finances/`, `modules/Clinic/tests/Unit/Finances/`, and `resources/js/test/finances/` (add `.gitkeep` if needed)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, enums, models, auth scaffolding, and shared domain/ports that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend — Enums

- [ ] T004 [P] Create `FinancialTransactionType` enum (`entrada`, `saida`) in `modules/Clinic/app/Enums/FinancialTransactionType.php`
- [ ] T005 [P] Create `FinancialTransactionStatus` enum (`recebido`, `pendente`, `pago`) in `modules/Clinic/app/Enums/FinancialTransactionStatus.php`
- [ ] T006 [P] Create `PaymentMethod` enum (`dinheiro`, `pix`, `cartao_debito`, `cartao_credito`, `transferencia`, `boleto`, `outro`) in `modules/Clinic/app/Enums/PaymentMethod.php`
- [ ] T007 [P] Create `FinancialCategoryOrigin` enum (`system`, `custom`) in `modules/Clinic/app/Enums/FinancialCategoryOrigin.php`

### Backend — Migrations (single, sequential — no incremental)

- [ ] T008 [P] Migration `clinic_financial_categories` (nullable `clinic_id`, `name`, `type`, `origin`, `active`, `display_order`, timestamps; indexes `(clinic_id,type,active)`, `(origin,type)`, unique `(clinic_id,name,type)`) in `modules/Clinic/database/migrations/2026_06_20_000001_create_clinic_financial_categories_table.php`
- [ ] T009 [P] Migration `clinic_financial_category_overrides` (`clinic_id`, `financial_category_id`, `active` default false, timestamps; unique `(clinic_id,financial_category_id)`) in `modules/Clinic/database/migrations/2026_06_20_000002_create_clinic_financial_category_overrides_table.php`
- [ ] T010 [P] Migration `clinic_financial_opening_balances` (`clinic_id`, `year`, `month`, `amount` decimal(14,2), `updated_by_user_id` nullable, timestamps; unique `(clinic_id,year,month)`) in `modules/Clinic/database/migrations/2026_06_20_000003_create_clinic_financial_opening_balances_table.php`
- [ ] T011 [P] Migration `clinic_financial_transactions` (FKs `clinic_id`, `financial_category_id` restrict, enums `type/status/payment_method`, `date`, `description`, `gross_amount`, `fee_amount`, `net_amount` generated-or-computed, `notes`, `created_by_user_id`, `deleted_by_user_id`, timestamps + `deleted_at`; indexes per data-model.md) in `modules/Clinic/database/migrations/2026_06_20_000004_create_clinic_financial_transactions_table.php`

### Backend — Models

- [ ] T012 [P] `FinancialCategory` model (casts for `type`/`origin`/`active`, `scopeAvailableForClinic` implementing the seed∪custom−overrides visibility query) in `modules/Clinic/app/Models/FinancialCategory.php`
- [ ] T013 [P] `ClinicCategoryOverride` model in `modules/Clinic/app/Models/ClinicCategoryOverride.php`
- [ ] T014 [P] `PeriodOpeningBalance` model (casts, `belongsTo` clinic + updatedBy) in `modules/Clinic/app/Models/PeriodOpeningBalance.php`
- [ ] T015 [P] `FinancialTransaction` model (`SoftDeletes`, enum casts, `category`/`createdBy`/`deletedBy` relations, `scopeForClinic`, net_amount accessor) in `modules/Clinic/app/Models/FinancialTransaction.php`

### Backend — Factories & Seeder

- [ ] T016 [P] `FinancialCategoryFactory` in `modules/Clinic/database/factories/FinancialCategoryFactory.php`
- [ ] T017 [P] `FinancialTransactionFactory` in `modules/Clinic/database/factories/FinancialTransactionFactory.php`
- [ ] T018 `FinancialCategorySeeder` seeding system categories (entradas + saídas per data-model.md §Seed, `firstOrCreate` by `(origin=system,name,type)`) in `modules/Clinic/database/seeders/FinancialCategorySeeder.php`

### Backend — Authorization scaffolding

- [ ] T019 `EnsureClinicAdmin` middleware (returns 403 `"Acesso restrito ao administrador da clínica."` for non-admin clinic users; reuse existing equivalent if present) in `modules/Clinic/app/Http/Middleware/EnsureClinicAdmin.php`
- [ ] T020 [P] `FinancialTransactionPolicy` (admin-only + clinic ownership by `clinic_id`) in `modules/Clinic/app/Policies/FinancialTransactionPolicy.php`
- [ ] T021 [P] `FinancialCategoryPolicy` (admin-only; custom mutations restricted to own clinic) in `modules/Clinic/app/Policies/FinancialCategoryPolicy.php`
- [ ] T022 Register policies, repository bindings (interfaces below), and `clinic.admin` middleware alias in `modules/Clinic/app/Providers/ClinicServiceProvider.php`

### Backend — Repository contracts

- [ ] T023 [P] Create repository interfaces `FinancialTransactionRepositoryInterface`, `FinancialCategoryRepositoryInterface`, `PeriodOpeningBalanceRepositoryInterface` in `modules/Clinic/app/Contracts/`

### Backend — Route group skeleton

- [ ] T024 Add `/clinic/finances/*` route group guarded by `auth:clinic` + `clinic.admin` middleware in `modules/Clinic/routes/clinic.php` (empty group, endpoints added per story)

### Frontend — Shared domain & ports

- [ ] T025 [P] Create pure domain entities + enums (camelCase: `FinancialTransaction`, `FinancialCategory`, `MonthlySummary`, `OpeningBalance`, type/status/method/origin unions) in `resources/js/domain/clinic/finance.ts`
- [ ] T026 Add `FinancePorts` (transactions/summary/categories/report/export/opening-balance repository ports) to `resources/js/application/clinic/ports.ts`

**Checkpoint**: Schema migrates cleanly (`migrate:fresh --seed`), enums/models/policies/ports exist — user stories can begin

---

## Phase 3: User Story 1 - Registrar e acompanhar transações do mês (Priority: P1) 🎯 MVP

**Goal**: Admin can create/edit/delete (soft) transactions for a selected month, see month cards (Entradas/Saídas/Saldo), adjust opening balance, and restore from trash.

**Independent Test**: Open Finanças on current month → empty state + zeroed cards; add an entry (R$150, "Atendimento", Recebido) → appears in list, Entradas/Recebido = R$150, Saldo/Disponível = R$150; edit to Pendente → migrates without changing total; delete → leaves list & cards, appears in trash; restore → returns.

### Tests for User Story 1 ⚠️ (write first, ensure they FAIL)

- [ ] T027 [P] [US1] Feature test `CreateFinancialTransactionTest` (POST creates, validates gross>0, status↔type, category visibility) in `modules/Clinic/tests/Feature/Finances/CreateFinancialTransactionTest.php`
- [ ] T028 [P] [US1] Feature test `UpdateFinancialTransactionTest` (PUT updates, status transition) in `modules/Clinic/tests/Feature/Finances/UpdateFinancialTransactionTest.php`
- [ ] T029 [P] [US1] Feature test `ListFinancialTransactionsTest` (GET paginated by period, excludes soft-deleted) in `modules/Clinic/tests/Feature/Finances/ListFinancialTransactionsTest.php`
- [ ] T030 [P] [US1] Feature test `SoftDeleteAndRestoreTransactionTest` (DELETE sets deleted_by/at, restore returns) in `modules/Clinic/tests/Feature/Finances/SoftDeleteAndRestoreTransactionTest.php`
- [ ] T031 [P] [US1] Feature test `ListTrashedTransactionsTest` (trash list with deleted_by/at) in `modules/Clinic/tests/Feature/Finances/ListTrashedTransactionsTest.php`
- [ ] T032 [P] [US1] Feature test `FinancialSummaryTest` (income/expense/available/forecast incl. opening balance) in `modules/Clinic/tests/Feature/Finances/FinancialSummaryTest.php`
- [ ] T033 [P] [US1] Feature test `OpeningBalanceTest` (PUT upserts per clinic/year/month, recalculates available) in `modules/Clinic/tests/Feature/Finances/OpeningBalanceTest.php`
- [ ] T034 [P] [US1] Feature test `AuthorizationAdminOnlyTest` (non-admin → 403, other clinic → 403/404, multi-tenant isolation) in `modules/Clinic/tests/Feature/Finances/AuthorizationAdminOnlyTest.php`
- [ ] T035 [P] [US1] Unit test `FinanceSummaryServiceTest` (available = opening + received − paid; forecast formula) in `modules/Clinic/tests/Unit/Finances/FinanceSummaryServiceTest.php`
- [ ] T036 [P] [US1] Frontend repository test `api-clinic-finance-transactions.test.ts` (snake↔camel mapping, envelope) in `resources/js/test/finances/api-clinic-finance-transactions.test.ts`
- [ ] T037 [P] [US1] Frontend hook test `use-finance-summary.test.tsx` (mock repo) in `resources/js/test/finances/use-finance-summary.test.tsx`
- [ ] T038 [P] [US1] Frontend form schema test `finance-transaction-form.test.ts` (Zod: gross>0, status↔type) in `resources/js/test/finances/finance-transaction-form.test.ts`

### Backend implementation for User Story 1

- [ ] T039 [P] [US1] `FinancialTransactionRepository` (paginate by period/clinic, find own, create, update, soft delete w/ deleted_by, restore, trash list) in `modules/Clinic/app/Repositories/FinancialTransactionRepository.php`
- [ ] T040 [P] [US1] `PeriodOpeningBalanceRepository` (find + upsert by clinic/year/month) in `modules/Clinic/app/Repositories/PeriodOpeningBalanceRepository.php`
- [ ] T041 [P] [US1] `StoreFinancialTransactionRequest` (all domain rules: gross>0, fee≤gross, status∈type, category visible & same type, date sanity) in `modules/Clinic/app/Http/Requests/StoreFinancialTransactionRequest.php`
- [ ] T042 [P] [US1] `UpdateFinancialTransactionRequest` in `modules/Clinic/app/Http/Requests/UpdateFinancialTransactionRequest.php`
- [ ] T043 [P] [US1] `UpdatePeriodOpeningBalanceRequest` in `modules/Clinic/app/Http/Requests/UpdatePeriodOpeningBalanceRequest.php`
- [ ] T044 [US1] `FinancialTransactionService` (CRUD, soft delete with current user, restore, computes net_amount) in `modules/Clinic/app/Services/FinancialTransactionService.php` (depends on T039)
- [ ] T045 [US1] `FinanceSummaryService` (aggregates received/pending/paid + opening balance → available/forecast via SUM/GROUP BY) in `modules/Clinic/app/Services/FinanceSummaryService.php` (depends on T039, T040)
- [ ] T046 [US1] `FinancialTransactionController` (index, store, show, update, destroy, trash, restore) with `authorizeResource` in `modules/Clinic/app/Http/Controllers/FinancialTransactionController.php` (depends on T044)
- [ ] T047 [US1] `FinancialSummaryController` (summary GET + opening-balance PUT) in `modules/Clinic/app/Http/Controllers/FinancialSummaryController.php` (depends on T045)
- [ ] T048 [US1] Register US1 routes (transactions CRUD + `/trash` + `/{id}/restore`, `/summary`, `/opening-balance`) in `modules/Clinic/routes/clinic.php` (depends on T024)

### Frontend implementation for User Story 1

- [ ] T049 [P] [US1] Repository `api-clinic-finance-transactions.ts` (list/get/create/update/delete/restore/trash, snake↔camel mapper) in `resources/js/infrastructure/repositories/api-clinic-finance-transactions.ts`
- [ ] T050 [P] [US1] Repository `api-clinic-finance-summary.ts` in `resources/js/infrastructure/repositories/api-clinic-finance-summary.ts`
- [ ] T051 [P] [US1] Repository `api-clinic-finance-opening-balance.ts` in `resources/js/infrastructure/repositories/api-clinic-finance-opening-balance.ts`
- [ ] T052 [P] [US1] Zod schema + form mapper `finance-transaction-form.ts` in `resources/js/application/clinic/finance-transaction-form.ts`
- [ ] T053 [US1] React Query hooks `use-finance-transactions.ts` (list/create/update/delete/restore/trash, invalidation) in `resources/js/application/clinic/use-finance-transactions.ts` (depends on T049)
- [ ] T054 [US1] Hook `use-finance-summary.ts` in `resources/js/application/clinic/use-finance-summary.ts` (depends on T050)
- [ ] T055 [US1] Hook `use-finance-opening-balance.ts` in `resources/js/application/clinic/use-finance-opening-balance.ts` (depends on T051)
- [ ] T056 [P] [US1] `FinanceMoneyDisplay.tsx` (BRL formatter, respects hidden mode prop) in `resources/js/components/clinic/finances/FinanceMoneyDisplay.tsx`
- [ ] T057 [P] [US1] `FinancePeriodSelector.tsx` (←/→ month + month/year picker, TZ-aware) in `resources/js/components/clinic/finances/FinancePeriodSelector.tsx`
- [ ] T058 [US1] `FinanceSummaryCards.tsx` (Entradas/Saídas/Saldo, opening-balance edit pencil) in `resources/js/components/clinic/finances/FinanceSummaryCards.tsx` (depends on T054, T056)
- [ ] T059 [US1] `FinanceOpeningBalanceDialog.tsx` (RHF+Zod edit dialog) in `resources/js/components/clinic/finances/FinanceOpeningBalanceDialog.tsx` (depends on T055)
- [ ] T060 [US1] `FinanceTransactionDialog.tsx` (New/Edit modal, RHF+Zod, category select by type) in `resources/js/components/clinic/finances/FinanceTransactionDialog.tsx` (depends on T052, T053)
- [ ] T061 [US1] `FinanceTransactionsTable.tsx` (DataTable: Data/Descrição/Categoria/Tipo/Valor/Status, sort, pagination 10/25/50, expandable row, edit/delete actions) in `resources/js/components/clinic/finances/FinanceTransactionsTable.tsx` (depends on T053, T056)
- [ ] T062 [US1] `FinancesPage.tsx` (Tabs shell + Finanças tab: period selector + cards + table + Adicionar CTA + empty/skeleton states) in `resources/js/pages/clinic/finances/FinancesPage.tsx` (depends on T058, T061)
- [ ] T063 [US1] `FinancesTrashPage.tsx` (trash list: Data/Descrição/Categoria/Tipo/Valor/Quem excluiu/Quando + Restaurar) in `resources/js/pages/clinic/finances/FinancesTrashPage.tsx` (depends on T053)
- [ ] T064 [US1] Route file `finance-routes.tsx` (`/clinica/financas`, `/clinica/financas/lixeira` with loaders calling application hooks) in `resources/js/routes/clinic/finance-routes.tsx` (depends on T062, T063)
- [ ] T065 [US1] Wire `financeRoutes` into `resources/js/routes/clinic-routes.tsx` and add admin-only Finanças entry to `ClinicSidebar` (hidden for non-admin per FR-037)
- [ ] T066 [P] [US1] Frontend test `FinanceTransactionDialog.test.tsx` (RHF+Zod validation, submit) in `resources/js/test/finances/FinanceTransactionDialog.test.tsx`
- [ ] T067 [P] [US1] Frontend test `FinanceTransactionsTable.test.tsx` (render rows, pagination, expand, actions) in `resources/js/test/finances/FinanceTransactionsTable.test.tsx`

**Checkpoint**: US1 fully functional and independently testable (MVP) — `composer run test` + `npm run test` green for Finances

---

## Phase 4: User Story 2 - Filtrar, buscar e ocultar valores (Priority: P2)

**Goal**: Combine type/status/category/method filters + debounced text search; cards reflect the filtered slice; toggle to hide all monetary values (persisted per user).

**Independent Test**: With a varied set of transactions, apply "Saídas › Saídas pendentes" → list & cards show only matching; type "João" → list filters in real time; "Limpar filtros" resets; eye toggle replaces all values with "•••" and persists across reload.

### Tests for User Story 2 ⚠️

- [ ] T068 [P] [US2] Extend `ListFinancialTransactionsTest` with filter/search cases (type/status/category/method/q) in `modules/Clinic/tests/Feature/Finances/ListFinancialTransactionsTest.php`
- [ ] T069 [P] [US2] Feature test that `summary` reflects applied filters (FR-019) in `modules/Clinic/tests/Feature/Finances/FinancialSummaryTest.php`

### Implementation for User Story 2

- [ ] T070 [US2] Extend `FinancialTransactionRepository` + `FinanceSummaryService` query to honor `type/status/category_id/payment_method/q` filters (FR-015, FR-018, FR-019) in `modules/Clinic/app/Repositories/FinancialTransactionRepository.php` and `modules/Clinic/app/Services/FinanceSummaryService.php`
- [ ] T071 [P] [US2] Hook `use-finance-values-visibility.ts` (toggle persisted in `localStorage` per user) in `resources/js/application/clinic/use-finance-values-visibility.ts`
- [ ] T072 [US2] Extend `use-finance-transactions.ts`/`use-finance-summary.ts` to accept and pass filter+search params in `resources/js/application/clinic/`
- [ ] T073 [P] [US2] `FinanceSearchInput.tsx` (250ms debounce) in `resources/js/components/clinic/finances/FinanceSearchInput.tsx`
- [ ] T074 [P] [US2] `FinanceToggleHidden.tsx` (eye icon toggle) in `resources/js/components/clinic/finances/FinanceToggleHidden.tsx`
- [ ] T075 [US2] `FinanceFiltersDrawer.tsx` (type/status presets per FR-015, category by type, method, Limpar/Aplicar) in `resources/js/components/clinic/finances/FinanceFiltersDrawer.tsx` (depends on T072)
- [ ] T076 [US2] Integrate filters/search/hidden toggle into `FinancesPage.tsx` and propagate hidden state to cards/table/money display in `resources/js/pages/clinic/finances/FinancesPage.tsx` (depends on T071, T073, T074, T075)

**Checkpoint**: US1 + US2 both work independently

---

## Phase 5: User Story 3 - Analisar resultados no painel Relatório (Priority: P2)

**Goal**: Relatório tab with totals+variation cards, line chart (income×expense), pie (top-5 categories), 12-month bar chart, breakdown table, period comparison, PNG/PDF export of the report.

**Independent Test**: With transactions across ≥2 months, open Relatório → cards show totals + variation ↑/↓; line tooltip shows exact values; pie top-5 with interactive legend; 12-month bars; breakdown table ordenável/filtrável; switching period updates all coherently; export chart PNG downloads.

### Tests for User Story 3 ⚠️

- [ ] T077 [P] [US3] Feature test `FinancialReportTest` (summary+variation, income-vs-expense, category-distribution top5, monthly-comparison 12, category-breakdown) in `modules/Clinic/tests/Feature/Finances/FinancialReportTest.php`
- [ ] T078 [P] [US3] Unit test `FinanceReportServiceTest` (variation null when previous=0; percentage rounding) in `modules/Clinic/tests/Unit/Finances/FinanceReportServiceTest.php`

### Backend implementation for User Story 3

- [ ] T079 [US3] `FinanceReportService` (summary+variation, income-vs-expense series w/ granularity, category-distribution top-N, 12-month comparison, category-breakdown) in `modules/Clinic/app/Services/FinanceReportService.php`
- [ ] T080 [US3] `FinancialReportController` (5 report endpoints per contract) in `modules/Clinic/app/Http/Controllers/FinancialReportController.php` (depends on T079)
- [ ] T081 [US3] Register `reports/*` routes in `modules/Clinic/routes/clinic.php`

### Frontend implementation for User Story 3

- [ ] T082 [P] [US3] Repository `api-clinic-finance-report.ts` (5 report calls + mappers) in `resources/js/infrastructure/repositories/api-clinic-finance-report.ts`
- [ ] T083 [US3] Hook `use-finance-report.ts` (queries per report section + period/comparison params) in `resources/js/application/clinic/use-finance-report.ts` (depends on T082)
- [ ] T084 [P] [US3] `report/ReportCards.tsx` (totals + variation indicator) in `resources/js/components/clinic/finances/report/ReportCards.tsx`
- [ ] T085 [P] [US3] `report/IncomeVsExpenseLineChart.tsx` (Chart.js, tooltip) in `resources/js/components/clinic/finances/report/IncomeVsExpenseLineChart.tsx`
- [ ] T086 [P] [US3] `report/CategoryDistributionPieChart.tsx` (Chart.js, interactive legend) in `resources/js/components/clinic/finances/report/CategoryDistributionPieChart.tsx`
- [ ] T087 [P] [US3] `report/MonthlyComparisonBarChart.tsx` (Chart.js, 12 months) in `resources/js/components/clinic/finances/report/MonthlyComparisonBarChart.tsx`
- [ ] T088 [P] [US3] `report/CategoryBreakdownTable.tsx` (Categoria/Quantidade/Valor/Percentual, sort + type filter) in `resources/js/components/clinic/finances/report/CategoryBreakdownTable.tsx`
- [ ] T089 [US3] Build Relatório tab in `FinancesPage.tsx`: assemble cards+charts+table, period comparison selector, PNG export from chart canvas in `resources/js/pages/clinic/finances/FinancesPage.tsx` (depends on T083, T084–T088)

**Checkpoint**: US1, US2, US3 independently functional

---

## Phase 6: User Story 4 - Exportar transações em CSV / XLSX / PDF (Priority: P3)

**Goal**: Export modal with range (current/previous/custom) and format (CSV/XLSX/PDF); server streams file with real values; disabled when empty range or to<from.

**Independent Test**: Open export modal → choose Mês anterior + CSV → file downloads with columns Data/Descrição/Categoria/Tipo/Método/Valor bruto/Taxa/Valor líquido/Status; custom range with to<from disables button; empty range → 422 friendly message.

### Tests for User Story 4 ⚠️

- [ ] T090 [P] [US4] Feature test `ExportTransactionsTest` (CSV/XLSX/PDF headers + content; 422 on empty range; values ignore hidden) in `modules/Clinic/tests/Feature/Finances/ExportTransactionsTest.php`

### Backend implementation for User Story 4

- [ ] T091 [P] [US4] `ExportFinancialTransactionsRequest` (format/range/from/to validation; custom requires from≤to) in `modules/Clinic/app/Http/Requests/ExportFinancialTransactionsRequest.php`
- [ ] T092 [P] [US4] `FinanceCsvExporter` (native streamed CSV) in `modules/Clinic/app/Services/Export/FinanceCsvExporter.php`
- [ ] T093 [P] [US4] `FinanceXlsxExporter` (openspout) in `modules/Clinic/app/Services/Export/FinanceXlsxExporter.php`
- [ ] T094 [P] [US4] PDF Blade view `export-transactions.blade.php` in `modules/Clinic/resources/views/finance/export-transactions.blade.php`
- [ ] T095 [US4] `FinancePdfExporter` (DomPDF via Pdf module, uses Blade view) in `modules/Clinic/app/Services/Export/FinancePdfExporter.php` (depends on T094)
- [ ] T096 [US4] `FinancialExportController` (resolves range→dates, 422 when empty, dispatches exporter, streams w/ Content-Disposition) in `modules/Clinic/app/Http/Controllers/FinancialExportController.php` (depends on T092, T093, T095)
- [ ] T097 [US4] Register `GET /clinic/finances/export` route in `modules/Clinic/routes/clinic.php`

### Frontend implementation for User Story 4

- [ ] T098 [P] [US4] Repository `api-clinic-finance-export.ts` (blob download w/ filename from header) in `resources/js/infrastructure/repositories/api-clinic-finance-export.ts`
- [ ] T099 [US4] Hook `use-finance-export.ts` (trigger download, surface 422 in dialog) in `resources/js/application/clinic/use-finance-export.ts` (depends on T098)
- [ ] T100 [US4] `FinanceExportDialog.tsx` (range + format, disable on invalid/empty range) and wire into `FinancesPage.tsx` options menu in `resources/js/components/clinic/finances/FinanceExportDialog.tsx` (depends on T099)

**Checkpoint**: US1–US4 independently functional

---

## Phase 7: User Story 5 - Configurar preferências financeiras (Priority: P3)

**Goal**: Settings panel with "Configurar repasses" promotional state (CTA) and custom-category management (create/toggle/delete) scoped to the clinic.

**Independent Test**: Open Configurações → repasses section shows "Funcionalidade disponível apenas para equipes" + CTA; Gerenciar categorias → create "Pilates" entrada appears in transaction select; deactivate seed "Consultoria" → disappears from select but old transactions keep the name.

### Tests for User Story 5 ⚠️

- [ ] T101 [P] [US5] Feature test `FinancialCategoryCustomTest` (create custom, toggle custom, delete blocked 409 when linked) in `modules/Clinic/tests/Feature/Finances/FinancialCategoryCustomTest.php`
- [ ] T102 [P] [US5] Feature test `CategoryOverrideTest` (toggle system category creates/updates override; visibility query) in `modules/Clinic/tests/Feature/Finances/CategoryOverrideTest.php`

### Backend implementation for User Story 5

- [ ] T103 [P] [US5] `FinancialCategoryRepository` (effective visibility list, create custom, toggle system→override / custom→active, delete-if-no-transactions) in `modules/Clinic/app/Repositories/FinancialCategoryRepository.php`
- [ ] T104 [P] [US5] `StoreFinancialCategoryRequest` (name + type, unique per clinic) in `modules/Clinic/app/Http/Requests/StoreFinancialCategoryRequest.php`
- [ ] T105 [US5] `FinancialCategoryService` (create/toggle/delete with 409 on linked transactions) in `modules/Clinic/app/Services/FinancialCategoryService.php` (depends on T103)
- [ ] T106 [US5] `FinancialCategoryController` (index/store/toggle-active/destroy) with policy in `modules/Clinic/app/Http/Controllers/FinancialCategoryController.php` (depends on T105)
- [ ] T107 [US5] Register `categories` routes (index/store/{id}/toggle-active/destroy) in `modules/Clinic/routes/clinic.php`

### Frontend implementation for User Story 5

- [ ] T108 [P] [US5] Repository `api-clinic-finance-categories.ts` in `resources/js/infrastructure/repositories/api-clinic-finance-categories.ts`
- [ ] T109 [US5] Hook `use-finance-categories.ts` (list/create/toggle/delete + invalidation; also consumed by US1 transaction form select) in `resources/js/application/clinic/use-finance-categories.ts` (depends on T108)
- [ ] T110 [P] [US5] `FinanceSettingsPanel.tsx` (repasses promo + CTA + link to categories) in `resources/js/components/clinic/finances/FinanceSettingsPanel.tsx`
- [ ] T111 [US5] `FinancesCategoriesPage.tsx` (list effective categories, create custom RHF+Zod, toggle, delete) in `resources/js/pages/clinic/finances/FinancesCategoriesPage.tsx` (depends on T109)
- [ ] T112 [US5] Add `/clinica/financas/categorias` route in `resources/js/routes/clinic/finance-routes.tsx` and wire settings panel/options menu in `FinancesPage.tsx` (depends on T111, T110)
- [ ] T113 [US5] Point `FinanceTransactionDialog` category select to `use-finance-categories` (replace any placeholder data) in `resources/js/components/clinic/finances/FinanceTransactionDialog.tsx`

**Checkpoint**: All user stories independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T114 [P] Loading/skeleton + error-with-retry states across cards/table/charts (FR-041) in `resources/js/pages/clinic/finances/FinancesPage.tsx` and chart components
- [ ] T115 [P] Accessibility + responsive pass (keyboard nav, ARIA labels, desktop side filters / mobile drawer / horizontal table scroll — FR-042, FR-043) across `resources/js/components/clinic/finances/`
- [ ] T116 [P] Toast confirmations on create/edit/delete/export (FR-040) via `sonner` in finance hooks/pages
- [ ] T117 Add short-TTL (60s) listing cache keyed by `(clinic_id, period, filters)` invalidated on store/update/destroy/restore (Performance Goal SC-002) in `FinancialTransactionService`/`FinanceSummaryService`
- [ ] T118 [P] Create `FinancialDemoSeeder` (~5k current-month + 10k 12-month transactions) for SC-002/SC-005 smoke checks in `modules/Clinic/database/seeders/FinancialDemoSeeder.php`
- [ ] T119 Run `./vendor/bin/pint`, `npm run lint`, `npm run format`, `npm run types`; fix issues
- [ ] T120 Execute `quickstart.md` validation end-to-end (US1–US5 + opening balance + admin-only) and confirm `composer run test` + `npm run test` green

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories
- **User Stories (Phase 3–7)**: all depend on Foundational; then parallelizable, or sequential by priority (P1 → P2 → P3)
- **Polish (Phase 8)**: depends on the targeted stories being complete

### User Story Dependencies

- **US1 (P1)**: only Foundational. MVP.
- **US2 (P2)**: Foundational; extends US1 list/summary but independently testable.
- **US3 (P2)**: Foundational + transaction data (US1) to be meaningful; backend/report layer is otherwise independent.
- **US4 (P3)**: Foundational + transactions to export; independent feature surface.
- **US5 (P3)**: Foundational; provides custom categories. US1's transaction form uses seed categories until T113 swaps in the live hook.

### Within Each User Story

- Tests first (must FAIL) → repositories/requests → services → controllers/routes → frontend repos → hooks → components → pages/routes
- Same-file tasks are sequential; `[P]` tasks touch different files

### Parallel Opportunities

- All Phase 1 `[P]` tasks together
- Phase 2: enums (T004–T007), migrations (T008–T011), models (T012–T015), factories (T016–T017), policies (T020–T021), interfaces (T023), domain (T025) all parallel
- All US tests `[P]` together at the start of each story
- After Foundational, different developers can take US1–US5 in parallel

---

## Parallel Example: User Story 1

```bash
# US1 tests together (write first, ensure they fail):
Task: "CreateFinancialTransactionTest in modules/Clinic/tests/Feature/Finances/CreateFinancialTransactionTest.php"
Task: "FinancialSummaryTest in modules/Clinic/tests/Feature/Finances/FinancialSummaryTest.php"
Task: "AuthorizationAdminOnlyTest in modules/Clinic/tests/Feature/Finances/AuthorizationAdminOnlyTest.php"
Task: "api-clinic-finance-transactions.test.ts in resources/js/test/finances/"

# US1 repositories + requests together:
Task: "FinancialTransactionRepository in modules/Clinic/app/Repositories/FinancialTransactionRepository.php"
Task: "PeriodOpeningBalanceRepository in modules/Clinic/app/Repositories/PeriodOpeningBalanceRepository.php"
Task: "StoreFinancialTransactionRequest in modules/Clinic/app/Http/Requests/StoreFinancialTransactionRequest.php"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & VALIDATE** (quickstart §4 + §9 + §10) → deploy/demo.

### Incremental Delivery

Setup + Foundational → US1 (MVP) → US2 → US3 → US4 → US5 → Polish. Each story is an independently testable increment.

### Parallel Team Strategy

After Foundational: Dev A → US1; Dev B → US3 (report layer); Dev C → US4/US5. US2 builds on US1's list and is best done by US1's owner.

---

## Notes

- `[P]` = different files, no incomplete-task dependency
- Backend é fonte de verdade: authorization (admin-only Policy + `clinic.admin` middleware), domain validation, and saldo calc live server-side
- Frontend layering: pages never import `apiClient`; loaders call `application/` hooks
- Verify tests fail before implementing; commit after each task or logical group
- Stop at any checkpoint to validate a story independently
