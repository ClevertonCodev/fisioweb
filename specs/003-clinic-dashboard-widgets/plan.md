# Implementation Plan: Dashboard da Clínica com Widgets por Papel

**Branch**: `003-clinic-dashboard-widgets` | **Date**: 2026-06-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-clinic-dashboard-widgets/spec.md`

## Summary

Transformar o dashboard da clínica (hoje mockado em [DashboardPage.tsx](../../resources/js/pages/clinic/DashboardPage.tsx) com um `DashboardController` que só devolve 4 contagens) em um painel real, orientado a papel (admin/secretário/fisioterapeuta), com 9 widgets e 4 ações rápidas.

Abordagem **backend primeiro**: ampliar o `DashboardController`/`DashboardService` do módulo Clinic para servir cada widget escopado por papel (admin/secretário = clínica inteira com toggle "Somente meus"; fisioterapeuta = só os seus). Dois recursos novos de domínio: (1) uma **janela de atendimento configurável** por clínica (colunas novas em `clinics`) usada como denominador da Taxa de ocupação; (2) um **log de atividades** dedicado (`clinic_activities`) gravado por um `ActivityLogger` chamado nos Services existentes (paciente, plano de tratamento, agendamento). Toda visibilidade é decidida e aplicada no backend (fonte de verdade), nunca só na UI.

Depois, **frontend**: remover os mocks de `DashboardPage`, criar a camada DDD (domain → application/ports + hooks React Query → infrastructure/repository) e quebrar a página em componentes de widget que tratam loading/empty/error de forma isolada. Gráficos (Captação e Taxa de ocupação) com **Chart.js** via `react-chartjs-2`, conforme pedido explícito.

## Technical Context

**Language/Version**: PHP 8.2+ (Laravel 12) no backend; TypeScript strict + React 19 no frontend.

**Primary Dependencies**: Laravel 12, tymon/jwt-auth (guard `clinic`), Eloquent. Frontend: TanStack Query v5, axios `apiClient`, shadcn/ui, lucide-react, react-router-dom v6. **Nova dependência front**: `chart.js` + `react-chartjs-2` (pedido explícito do usuário; ver research sobre o `recharts` já presente). Reúso: módulo WhatsApp / link `wa.me` para "Enviar mensagem".

**Storage**: MySQL/PostgreSQL via Eloquent. Nova tabela `clinic_activities`. Colunas novas em `clinics` (janela de atendimento). Sem tabelas/colunas em outros módulos.

**Testing**: PHPUnit 11 + Mockery (`modules/Clinic/tests/`), Vitest 4 + Testing Library (`resources/js/test/`).

**Target Platform**: SPA web + REST API (servidor Linux/local dev).

**Project Type**: Web application (backend Laravel modular + frontend SPA React).

**Performance Goals**: Conteúdo inicial (ações rápidas + 4 cards + próximas consultas) renderizado em ≤ 2 s para clínica típica (SC-003). Widgets pesados (gráficos, feed) carregam de forma independente e não bloqueiam o restante (SC-006).

**Constraints**:
- **Backend é fonte de verdade** para visibilidade por papel (princípio 1 do CLAUDE.md; FR-005, SC-004). A UI esconde controles, o backend recusa escopo indevido.
- **Sem migrations incrementais** (sistema em dev, convenção do plano 002): editar a migration `create_clinics_table` para as colunas da janela de atendimento e recriar via `migrate:fresh`. `clinic_activities` é tabela nova (migration única). Prefixo `clinic_` (memória de case-sensitivity).
- Multi-tenant: todo acesso filtrado por `clinic_id` (FR-001).
- Frontend respeita separação de camadas (loader/hook→`application/`; page nunca importa `apiClient`; domain puro camelCase).
- Datas/janelas calculadas no **timezone da clínica** (`clinics.timezone`, já existente).

**Scale/Scope**: Escala de clínica (dezenas de profissionais, milhares de pacientes/consultas/ano). Escopo: 1 endpoint agregador + sub-endpoints por widget; 1 tabela nova + 1 migration editada; religar 1 tela já existente quebrando-a em ~9 componentes de widget.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

O arquivo `.specify/memory/constitution.md` está como template não preenchido (sem princípios ratificados). Na ausência de constituição formal, adoto como gates os **Princípios não-negociáveis do CLAUDE.md**:

| Gate | Status | Observação |
|------|--------|-----------|
| 1. Backend é fonte de verdade | ✅ PASS | Visibilidade por papel resolvida no `DashboardService`; testes de autorização (SC-004) garantem que fisioterapeuta não recebe escopo de clínica. |
| 2. Camadas separadas no frontend | ✅ PASS | `domain/clinic/dashboard.ts` puro; `application/clinic/use-dashboard.ts` (hooks) + `ports.ts`; `infrastructure/repositories/api-clinic-dashboard.ts`. Page não importa `apiClient`. |
| 3. `apiClient` é o único caminho HTTP | ✅ PASS | Novo `DashboardRepository` concreto usa `apiClient`; guard `clinic` inferido pela URL `/clinic/*`. |
| 4. Domain puro | ✅ PASS | Entidades de widget em camelCase, sem `_at`/`ApiXxx`/constantes de UI no domain. |
| 5. Form 2+ campos → RHF+Zod | ✅ PASS (N/A majoritário) | Dashboard é majoritariamente leitura; controles (toggle, seletor de fisio, abas, ano) são inputs simples — não exigem RHF. A janela de atendimento, se editável nesta feature, fica fora do dashboard (config) e usaria RHF+Zod. |

Sem violações. Nenhuma entrada em Complexity Tracking necessária.

## Project Structure

### Documentation (this feature)

```text
specs/003-clinic-dashboard-widgets/
├── plan.md              # Este arquivo
├── spec.md              # Especificação
├── research.md          # Phase 0 — decisões técnicas
├── data-model.md        # Phase 1 — entidades e schema
├── quickstart.md        # Phase 1 — guia de validação
├── contracts/
│   └── dashboard.md     # Phase 1 — contratos REST dos widgets
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
# Backend — módulo Clinic (vertical slice de dashboard + log de atividades)
modules/Clinic/
├── app/
│   ├── Models/
│   │   ├── ClinicActivity.php                  # novo (clinic_activities)
│   │   └── Clinic.php                          # editar: campos da janela + helper workingWindow()
│   ├── Enums/
│   │   └── ActivityType.php                    # novo (tipos de evento do log — FR-022b)
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── DashboardController.php         # editar: 1 endpoint agregador + ações por widget
│   │   └── Requests/
│   │       ├── OccupancyRateRequest.php        # novo (valida granularity + clinic_user_id)
│   │       └── PatientAcquisitionRequest.php   # novo (valida scope)
│   ├── Services/
│   │   ├── DashboardService.php                # novo (orquestra widgets + resolve escopo por papel)
│   │   ├── DashboardScope.php                  # novo (Value Object: papel + "mine" → filtros)
│   │   ├── OccupancyRateService.php            # novo (cálculo ocupação por granularidade)
│   │   └── ActivityLogger.php                  # novo (grava ClinicActivity)
│   ├── Repositories/
│   │   └── DashboardRepository.php             # novo (queries agregadas escopadas)
│   ├── Contracts/
│   │   ├── DashboardServiceInterface.php       # novo
│   │   ├── DashboardRepositoryInterface.php    # novo
│   │   └── ActivityLoggerInterface.php         # novo
│   └── Providers/
│       └── ClinicServiceProvider.php           # editar: binds dos novos contracts
├── database/migrations/
│   ├── 2026_02_27_000002_create_clinics_table.php          # EDITAR: colunas janela de atendimento
│   └── 2026_06_19_000001_create_clinic_activities_table.php # novo
└── tests/
    ├── Feature/Dashboard/                       # por papel + por widget (autorização, contagens)
    └── Unit/                                     # OccupancyRateService, DashboardScope, ActivityLogger

# Instrumentação do log (chamadas ao ActivityLogger nos Services existentes)
modules/Clinic/app/Services/{PatientService,TreatmentPlanService,AppointmentService}.php  # editar: logActivity(...)
modules/Patient/...  # PatientService de fato vive em Clinic (rotas clinic/patients) — confirmar no research

# Frontend — DDD + widgets
resources/js/
├── domain/clinic/dashboard.ts                  # novo (DashboardSummary, UpcomingAppointment, Birthday,
│                                               #        OccupancySeries, AcquisitionComparison, Activity, QuickAction)
├── application/clinic/
│   ├── ports.ts                                # editar: DashboardRepository (port)
│   └── use-dashboard.ts                        # novo (hooks React Query por widget)
├── infrastructure/repositories/
│   ├── api-clinic-dashboard.ts                 # novo (apiClient + mappers snake→camel)
│   └── index.ts                                # editar: export wiring
├── components/clinic/dashboard/                 # novo — 1 componente por widget
│   ├── QuickActions.tsx
│   ├── StatCards.tsx           (Pacientes ativos, Consultas hoje, Programas ativos, Exercícios)
│   ├── ScopeToggle.tsx         (Toda a clínica / Somente meus — admin)
│   ├── UpcomingAppointments.tsx
│   ├── MonthBirthdays.tsx      (+ botão WhatsApp wa.me)
│   ├── PatientAcquisitionChart.tsx   (Chart.js — comparação 3 anos)
│   ├── OccupancyRateChart.tsx        (Chart.js — Diária/Semanal/Mensal + seletor fisio)
│   └── RecentActivities.tsx    (admin/secretário)
└── pages/clinic/DashboardPage.tsx               # editar: remover mocks, compor os widgets na ordem do FR-027
```

**Structure Decision**: Web application modular, seguindo o padrão de vertical slice já consolidado em `modules/Clinic` (Controller→Service→Repository→Contract, binds no `ClinicServiceProvider`) e o DDD do frontend (domain→application→infrastructure→page) usado por todas as features anteriores. O dashboard **reaproveita** o `DashboardController`/`DashboardPage` existentes em vez de criar contexto novo (FR-028, Assumption "Reaproveitamento"). A visibilidade por papel é centralizada num único Value Object (`DashboardScope`) consumido por todas as queries, evitando regra de escopo duplicada por widget. O log de atividades é um serviço transversal (`ActivityLogger`) chamado pelos Services de domínio já existentes — sem espalhar lógica de gravação em controllers.

## Complexity Tracking

> Sem violações de gates — seção não aplicável.
