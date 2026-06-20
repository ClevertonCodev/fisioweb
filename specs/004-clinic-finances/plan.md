# Implementation Plan: Clinic Finances

**Branch**: `main` (feature em pasta `specs/004-clinic-finances`) | **Date**: 2026-06-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-clinic-finances/spec.md`

## Summary

Construir, no contexto **clinic**, a página **Finanças** com duas abas:

- **Finanças**: cards de Entradas/Saídas/Saldo do mês, lista paginada de transações (CRUD + soft delete permanente + tela de lixeira), filtros (tipo/status/categoria/método/busca), ocultar valores, gestão de categorias custom da clínica, painel de configurações e exportação CSV/XLSX/PDF.
- **Relatório**: cards de totais e variação, gráficos de linha (Entradas × Saídas), pizza (top categorias) e barras (12 meses), tabela resumo, comparação de períodos, exportação PNG/PDF.

Abordagem **backend primeiro**: novo módulo Eloquent + Controllers + Services + Repositories + Policies no módulo `Clinic` (`FinancialTransaction`, `FinancialCategory`, `ClinicCategoryOverride`, `PeriodOpeningBalance`). Policies + middleware `RequireClinicAdmin`-equivalente garantem que apenas o administrador da clínica acessa qualquer endpoint financeiro. Exportações geradas no servidor (CSV stream nativo, XLSX via `openspout/openspout`, PDF via módulo `Pdf` existente / `barryvdh/laravel-dompdf`).

Depois, **frontend** seguindo DDD do projeto (`domain/clinic/finance*.ts` → `application/clinic/use-finances*.ts` + `ports.ts` → `infrastructure/repositories/api-clinic-finances*.ts` → `pages/clinic/finances/`). Gráficos com **Chart.js via `react-chartjs-2`**, reaproveitando o `chart-setup.ts` já criado em `components/clinic/dashboard/` (a ser promovido para `components/charts/` para uso compartilhado entre Dashboard e Finanças). UI com shadcn/ui (DataTable, Dialog, Form RHF+Zod, Tabs), respeitando `frontend-ui-patterns`.

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 12) no backend; TypeScript strict + React 19 no frontend.

**Primary Dependencies**:
- Backend: Laravel 12, tymon/jwt-auth (guard `clinic`), Eloquent. Reutilização: módulo `Pdf` (DomPDF) para PDFs, módulo `Cloudflare` não é usado nesta feature (downloads diretos pelo navegador). **Nova dependência composer**: `openspout/openspout` (^4) para XLSX — leve, sem PhpSpreadsheet pesado.
- Frontend: TanStack Query v5, axios `apiClient`, shadcn/ui, lucide-react, react-router-dom v6, react-hook-form + Zod. **Reutilização explícita do conjunto já presente** `chart.js` ^4.5 + `react-chartjs-2` ^5.3 (decisão do usuário: "use a lib que já existe no sistema"; o `recharts` instalado fica para o wrapper `components/ui/chart.tsx` do shadcn e não é introduzido em Finanças). **Nenhuma nova dependência npm** para esta feature.

**Storage**: MySQL/PostgreSQL via Eloquent. Quatro tabelas novas (`clinic_financial_transactions`, `clinic_financial_categories`, `clinic_financial_category_overrides`, `clinic_financial_opening_balances`) — todas com prefixo `clinic_` (convenção do módulo, ver memória de case-sensitivity do plano 002). Soft delete permanente via coluna `deleted_at` + `deleted_by_user_id` em `clinic_financial_transactions`; **sem cron de purga**.

**Testing**: PHPUnit 11 + Mockery em `modules/Clinic/tests/Feature/Finances/` e `modules/Clinic/tests/Unit/Finances/`. Vitest 4 + Testing Library em `resources/js/test/finances/`. Padrões já cobertos pelas skills `php-testing` e `frontend-testing`.

**Target Platform**: SPA web + REST API. Servidor Linux/Docker (dev local via `composer run dev`).

**Project Type**: Web application (backend Laravel modular + frontend SPA React).

**Performance Goals**:
- Lista + cards do mês ≤ 1 s para até 5.000 transações/mês (SC-002).
- Aba Relatório ≤ 2 s para até 10.000 transações em 12 meses (SC-005). Atendido com agregações SQL (`SUM/GROUP BY` por mês/categoria), índices compostos e cache de página de listagem por (clinic_id, ano-mês, filtros) com TTL curto (60 s) — invalidado em cada `store/update/destroy/restore`.
- Filtros/busca refletindo em ≤ 300 ms (SC-006). Atendido com debounce de 250 ms no front + índices em (`clinic_id, date`), (`clinic_id, category_id`), (`clinic_id, status`).

**Constraints**:
- **Backend é fonte de verdade** para autorização (admin-only via Policy + middleware), validação de domínio (valor > 0, datas, enums) e cálculo do saldo previsto (FR-021).
- **Multi-tenant**: todo acesso filtrado por `clinic_id` (FR-036). Forçado por `BelongsToClinic` global scope nos models de Finanças.
- **Camadas separadas no frontend**: page nunca importa `apiClient`; loaders chamam hooks de `application/`.
- **Sem cálculo automático de taxa** (FR-004): valor líquido = `valor − taxa` quando taxa preenchida; sem percentual configurável.
- **Sem migrations incrementais** (convenção do plano 002): as 4 tabelas viram migrations únicas, sequenciais cronológicas, recriadas via `migrate:fresh` em dev.
- **Lixeira nunca purga** (FR-007, FR-007b, FR-007c): sem job/cron de expurgo nesta versão.
- Datas/períodos respeitam timezone da clínica (`clinics.timezone`) — mesma convenção do plano 003.

**Scale/Scope**: Clínica típica (centenas a milhares de transações/ano por clínica). Escopo entregável: 1 módulo backend novo (4 tabelas + 4 controllers REST + services/repositories/policies) e 1 conjunto de telas no front (1 página com 2 abas + drawer de filtros + dialog de transação + tela de lixeira + tela de gestão de categorias custom + dialog de exportação + dialog de saldo inicial).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

O arquivo `.specify/memory/constitution.md` continua como template não preenchido. Adoto como gates os **Princípios não-negociáveis do CLAUDE.md** (mesma postura do plano 003):

| Gate | Status | Observação |
|------|--------|-----------|
| 1. Backend é fonte de verdade | ✅ PASS | Acesso admin-only por Policy + `clinic.admin` middleware; cálculo de saldo (FR-021) feito no `FinanceSummaryService`; soft delete e ocultação de excluídas decidida no backend. |
| 2. Camadas separadas no frontend | ✅ PASS | `domain/clinic/finance.ts` puro (camelCase, enums centralizados), `application/clinic/use-finances*.ts` + `ports.ts`, `infrastructure/repositories/api-clinic-finances*.ts`. Pages só consomem hooks. |
| 3. `apiClient` é o único caminho HTTP | ✅ PASS | Novos repositórios usam `apiClient`; guard `clinic` inferido pela URL `/clinic/finances/*`. |
| 4. `domain/` puro | ✅ PASS | Sem `_at`, sem `ApiXxx`, sem mappers no domínio. Mapeamento snake_case ↔ camelCase em `infrastructure/`. |
| 5. Form com 2+ campos → RHF + Zod | ✅ PASS | Form de transação, form de categoria custom e form de saldo inicial: todos com RHF + Zod (skill `forms-shadcn`). |

Resultado: **sem violações**. Tabela de Complexity Tracking não preenchida.

## Project Structure

### Documentation (this feature)

```text
specs/004-clinic-finances/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── finances-api.md
├── checklists/
│   └── requirements.md  # Já existente
└── tasks.md             # /speckit-tasks (NÃO criado aqui)
```

### Source Code (repository root)

```text
modules/Clinic/
├── app/
│   ├── Contracts/
│   │   ├── FinancialTransactionRepositoryInterface.php       # NEW
│   │   ├── FinancialCategoryRepositoryInterface.php          # NEW
│   │   └── PeriodOpeningBalanceRepositoryInterface.php       # NEW
│   ├── Enums/
│   │   ├── FinancialTransactionType.php                      # NEW (entrada|saida)
│   │   ├── FinancialTransactionStatus.php                    # NEW (recebido|pendente|pago)
│   │   ├── PaymentMethod.php                                 # NEW (dinheiro|pix|cartao_debito|cartao_credito|transferencia|boleto|outro)
│   │   └── FinancialCategoryOrigin.php                       # NEW (system|custom)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── FinancialTransactionController.php            # NEW (CRUD + restore + trash)
│   │   │   ├── FinancialCategoryController.php               # NEW (list/create/toggle)
│   │   │   ├── FinancialSummaryController.php                # NEW (cards do mês + saldo inicial)
│   │   │   ├── FinancialReportController.php                 # NEW (relatório: linha/pizza/barras/tabela)
│   │   │   └── FinancialExportController.php                 # NEW (CSV/XLSX/PDF)
│   │   ├── Middleware/
│   │   │   └── EnsureClinicAdmin.php                         # NEW (ou reuso se existir equivalente)
│   │   └── Requests/
│   │       ├── StoreFinancialTransactionRequest.php          # NEW
│   │       ├── UpdateFinancialTransactionRequest.php         # NEW
│   │       ├── StoreFinancialCategoryRequest.php             # NEW
│   │       ├── UpdatePeriodOpeningBalanceRequest.php         # NEW
│   │       └── ExportFinancialTransactionsRequest.php        # NEW
│   ├── Models/
│   │   ├── FinancialTransaction.php                          # NEW (SoftDeletes + scopeForClinic)
│   │   ├── FinancialCategory.php                             # NEW (scopeAvailableForClinic)
│   │   ├── ClinicCategoryOverride.php                        # NEW
│   │   └── PeriodOpeningBalance.php                          # NEW
│   ├── Policies/
│   │   ├── FinancialTransactionPolicy.php                    # NEW (admin-only + ownership)
│   │   └── FinancialCategoryPolicy.php                       # NEW
│   ├── Providers/
│   │   └── ClinicServiceProvider.php                         # EDIT (bindings + policies)
│   ├── Repositories/
│   │   ├── FinancialTransactionRepository.php                # NEW
│   │   ├── FinancialCategoryRepository.php                   # NEW
│   │   └── PeriodOpeningBalanceRepository.php                # NEW
│   └── Services/
│       ├── FinancialTransactionService.php                   # NEW (CRUD, restore, cálculos)
│       ├── FinancialCategoryService.php                      # NEW
│       ├── FinanceSummaryService.php                         # NEW (cards: recebido/pendente/pago/saldo)
│       ├── FinanceReportService.php                          # NEW (séries linha/pizza/barras/tabela)
│       └── Export/
│           ├── FinanceCsvExporter.php                        # NEW (stream nativo)
│           ├── FinanceXlsxExporter.php                       # NEW (openspout)
│           └── FinancePdfExporter.php                        # NEW (DomPDF via módulo Pdf)
├── database/
│   ├── factories/
│   │   ├── FinancialTransactionFactory.php                   # NEW
│   │   └── FinancialCategoryFactory.php                      # NEW
│   ├── migrations/
│   │   ├── 2026_06_20_000001_create_clinic_financial_categories_table.php             # NEW
│   │   ├── 2026_06_20_000002_create_clinic_financial_category_overrides_table.php     # NEW
│   │   ├── 2026_06_20_000003_create_clinic_financial_opening_balances_table.php       # NEW
│   │   └── 2026_06_20_000004_create_clinic_financial_transactions_table.php           # NEW
│   └── seeders/
│       └── FinancialCategorySeeder.php                        # NEW (seed global)
├── resources/views/
│   └── finance/
│       ├── export-transactions.blade.php                      # NEW (PDF — lista)
│       └── export-report.blade.php                            # NEW (PDF — relatório)
├── routes/
│   └── clinic.php                                             # EDIT (rotas /clinic/finances/*)
└── tests/
    ├── Feature/
    │   └── Finances/
    │       ├── ListFinancialTransactionsTest.php              # NEW
    │       ├── CreateFinancialTransactionTest.php             # NEW
    │       ├── UpdateFinancialTransactionTest.php             # NEW
    │       ├── SoftDeleteAndRestoreTransactionTest.php        # NEW
    │       ├── ListTrashedTransactionsTest.php                # NEW
    │       ├── FinancialSummaryTest.php                       # NEW
    │       ├── FinancialReportTest.php                        # NEW
    │       ├── ExportTransactionsTest.php                     # NEW
    │       ├── FinancialCategoryCustomTest.php                # NEW
    │       ├── CategoryOverrideTest.php                       # NEW
    │       ├── OpeningBalanceTest.php                         # NEW
    │       └── AuthorizationAdminOnlyTest.php                 # NEW (não-admin recebe 403)
    └── Unit/
        └── Finances/
            ├── FinanceSummaryServiceTest.php                  # NEW
            └── FinanceReportServiceTest.php                   # NEW

resources/js/
├── domain/clinic/
│   └── finance.ts                                             # NEW (entidades + enums camelCase)
├── application/clinic/
│   ├── ports.ts                                               # EDIT (+ FinancePorts)
│   ├── use-finance-transactions.ts                            # NEW (list/create/update/delete/restore/trash hooks)
│   ├── use-finance-categories.ts                              # NEW
│   ├── use-finance-summary.ts                                 # NEW
│   ├── use-finance-report.ts                                  # NEW
│   ├── use-finance-export.ts                                  # NEW
│   ├── use-finance-opening-balance.ts                         # NEW
│   ├── use-finance-values-visibility.ts                       # NEW (toggle "ocultar valores" persistido)
│   └── finance-transaction-form.ts                            # NEW (Zod schema + mapper)
├── infrastructure/repositories/
│   ├── api-clinic-finance-transactions.ts                     # NEW
│   ├── api-clinic-finance-categories.ts                       # NEW
│   ├── api-clinic-finance-summary.ts                          # NEW
│   ├── api-clinic-finance-report.ts                           # NEW
│   ├── api-clinic-finance-export.ts                           # NEW
│   └── api-clinic-finance-opening-balance.ts                  # NEW
├── pages/clinic/finances/
│   ├── FinancesPage.tsx                                       # NEW (tabs Finanças/Relatório)
│   ├── FinancesTrashPage.tsx                                  # NEW (lixeira)
│   └── FinancesCategoriesPage.tsx                             # NEW (gestão de categorias custom)
├── components/clinic/finances/
│   ├── FinanceSummaryCards.tsx                                # NEW (Entradas/Saídas/Saldo)
│   ├── FinanceTransactionsTable.tsx                           # NEW (DataTable + paginação + expand)
│   ├── FinanceTransactionDialog.tsx                           # NEW (New/Edit em modal RHF+Zod)
│   ├── FinanceFiltersDrawer.tsx                               # NEW (painel lateral de filtros)
│   ├── FinanceSearchInput.tsx                                 # NEW (busca com debounce)
│   ├── FinanceToggleHidden.tsx                                # NEW (botão ocultar valores)
│   ├── FinanceExportDialog.tsx                                # NEW (modal CSV/XLSX/PDF)
│   ├── FinanceOpeningBalanceDialog.tsx                        # NEW (editar saldo inicial)
│   ├── FinanceSettingsPanel.tsx                               # NEW (repasses CTA + link categorias)
│   ├── FinanceMoneyDisplay.tsx                                # NEW (respeita hidden mode)
│   ├── FinancePeriodSelector.tsx                              # NEW (mês ←/→ + picker)
│   └── report/
│       ├── ReportCards.tsx                                    # NEW
│       ├── IncomeVsExpenseLineChart.tsx                       # NEW (Chart.js)
│       ├── CategoryDistributionPieChart.tsx                   # NEW (Chart.js)
│       ├── MonthlyComparisonBarChart.tsx                      # NEW (Chart.js)
│       └── CategoryBreakdownTable.tsx                         # NEW
├── components/charts/                                         # PROMOTE (mover chart-setup.ts e ChartContainer compartilhado)
│   └── chart-setup.ts                                         # MOVE de components/clinic/dashboard/
├── routes/clinic/
│   └── finance-routes.tsx                                     # NEW (3 rotas: /clinica/financas, /clinica/financas/lixeira, /clinica/financas/categorias)
└── routes/clinic-routes.tsx                                   # EDIT (incluir financeRoutes)

resources/js/test/finances/
├── api-clinic-finance-transactions.test.ts                    # NEW (repository)
├── use-finance-summary.test.tsx                               # NEW (hook + mock repo)
├── FinanceTransactionsTable.test.tsx                          # NEW (interação)
├── FinanceTransactionDialog.test.tsx                          # NEW (form RHF+Zod)
└── finance-transaction-form.test.ts                           # NEW (schema)
```

**Structure Decision**: Web application clássico do fisioweb — backend modular em `modules/Clinic/` (todos os artefatos vivem dentro do módulo, sem espalhar) + frontend SPA em `resources/js/` seguindo DDD (`domain → application → infrastructure → pages/components`). Nada novo de arquitetura: reaproveita exatamente o padrão dos módulos Patient/Appointment/Dashboard.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Nenhuma violação a justificar — todos os gates passaram.
