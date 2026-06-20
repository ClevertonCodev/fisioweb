---
description: "Task list for Dashboard da Clínica com Widgets por Papel"
---

# Tasks: Dashboard da Clínica com Widgets por Papel

**Input**: Design documents from `specs/003-clinic-dashboard-widgets/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/dashboard.md](./contracts/dashboard.md), [quickstart.md](./quickstart.md)

**Tests**: Incluídos onde os Success Criteria exigem (SC-004 autorização por papel; cálculo de ocupação). Não é TDD exaustivo — testes focados em escopo/autorização e regra de negócio.

**Organização**: por user story (P1→P3). Backend primeiro, depois religar o frontend. Cada migration é editada/criada na fase que a consome (convenção dev: `migrate:fresh`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos distintos, sem dependência pendente)
- **[Story]**: US1..US7 (mapeia spec.md)

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 [P] Adicionar deps `chart.js` e `react-chartjs-2` ao `package.json` e instalar (`npm install`) — research §1
- [x] T002 [P] Criar helper de registro do Chart.js em `resources/js/components/clinic/dashboard/chart-setup.ts` (registrar só `BarController`, `DoughnutController`, `ArcElement`, `BarElement`, `CategoryScale`, `LinearScale`, `Tooltip`, `Legend`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: nenhuma user story começa antes desta fase.

### Backend — esqueleto do dashboard + escopo por papel

- [x] T003 Criar Value Object `DashboardScope` em `modules/Clinic/app/Services/DashboardScope.php` (regras de papel→escopo: secretary=clínica; admin honra `mine`; physiotherapist forçado a si) — data-model §3, research §2
- [x] T004 [P] Criar `DashboardServiceInterface` e `DashboardRepositoryInterface` em `modules/Clinic/app/Contracts/`
- [x] T005 Criar `DashboardRepository` em `modules/Clinic/app/Repositories/DashboardRepository.php` (query builders escopados por `clinic_id` + `clinic_user_id` opcional)
- [x] T006 Criar `DashboardService` em `modules/Clinic/app/Services/DashboardService.php` (constrói `DashboardScope` a partir do `Auth::guard('clinic')->user()` + query `scope`)
- [x] T007 Editar `modules/Clinic/app/Http/Controllers/DashboardController.php` para injetar `DashboardServiceInterface` e devolver o agregado (substitui as 4 contagens ad-hoc atuais)
- [x] T008 Registrar binds dos novos contracts em `modules/Clinic/app/Providers/ClinicServiceProvider.php`
- [x] T009 Registrar as sub-rotas do dashboard (`occupancy-rate`, `patient-acquisition`, `activities`) sob o prefixo `dashboard` em `modules/Clinic/routes/clinic.php`

### Frontend — camadas DDD (esqueleto)

- [x] T010 [P] Criar `resources/js/domain/clinic/dashboard.ts` (tipos camelCase: `DashboardSummary`, `ViewerInfo`, `StatCards`, `UpcomingAppointment`, `Birthday`, `OccupancySeries`, `AcquisitionComparison`, `Activity`)
- [x] T011 [P] Adicionar port `DashboardRepository` em `resources/js/application/clinic/ports.ts`
- [x] T012 Criar `resources/js/infrastructure/repositories/api-clinic-dashboard.ts` (apiClient + mappers snake→camel) e exportar em `resources/js/infrastructure/repositories/index.ts`
- [x] T013 Criar `resources/js/application/clinic/use-dashboard.ts` com hooks React Query (um `queryKey` por widget) — esqueleto
- [x] T014 Refatorar `resources/js/pages/clinic/DashboardPage.tsx` para um shell que compõe componentes de widget e **remove os arrays mockados** (FR-028)

**Checkpoint**: fundação pronta — user stories podem começar.

---

## Phase 3: User Story 1 - Painel de indicadores e atalhos do dia (P1) 🎯 MVP

**Goal**: admin/secretário veem cards reais + próximas consultas + ações rápidas (clínica inteira).

**Independent Test**: login admin → cards refletem contagens reais da clínica; próximas consultas de hoje (≤5, ordenadas); cada ação rápida navega correto.

- [x] T015 [US1] Implementar contagens dos cards no `DashboardRepository`: pacientes ativos (`status NOT IN obito,cancelado,alta`), consultas hoje (timezone clínica, `!= cancelled`), programas ativos (FR-008), exercícios disponíveis + categorias (global) — research §3/4/5/6
- [x] T016 [US1] Montar payload agregado (`viewer` flags + `cards` + `upcoming_appointments` ≤5 ordenadas) no `DashboardService` (FR-010/010a, contracts §1)
- [x] T017 [P] [US1] Componente `resources/js/components/clinic/dashboard/StatCards.tsx` (4 cards)
- [x] T018 [P] [US1] Componente `resources/js/components/clinic/dashboard/UpcomingAppointments.tsx` (lista + status + "Ver agenda")
- [x] T019 [P] [US1] Componente `resources/js/components/clinic/dashboard/QuickActions.tsx` com navegação (FR-026)
- [x] T020 [US1] Conectar `useDashboardSummary` ao endpoint real e compor os widgets em `DashboardPage.tsx` na ordem do FR-027
- [x] T021 [US1] Ajustar `resources/js/pages/clinic/AgendaPage.tsx` para abrir o modal "Nova consulta" via `location.state`/query (deep-link da ação rápida — FR-026)
- [x] T022 [P] [US1] Feature test: agregado de admin/secretário (contagens da clínica inteira) em `modules/Clinic/tests/Feature/Dashboard/DashboardAggregateTest.php`

**Checkpoint**: MVP funcional — painel operacional do dia para admin/secretário.

---

## Phase 4: User Story 2 - Visão restrita do fisioterapeuta (P1)

**Goal**: fisioterapeuta vê apenas seus registros; sem feed de atividades; ocupação só dele.

**Independent Test**: login fisioterapeuta → cards/listas só dele; `scope`/`clinic_user_id` forjados são ignorados; widget de atividades não aparece.

- [x] T023 [US2] Garantir no `DashboardScope`/`DashboardService` que `physiotherapist` é forçado ao próprio `clinic_user_id` e que `viewer` retorna `can_toggle_scope=false`, `can_view_activities=false`, `can_choose_professional=false` (FR-003/005)
- [x] T024 [US2] Feature test de autorização: fisioterapeuta só vê os próprios; requisição forjada não vaza escopo (SC-004) em `modules/Clinic/tests/Feature/Dashboard/DashboardScopeTest.php`
- [x] T025 [US2] Frontend: esconder `ScopeToggle`, seletor de fisio e `RecentActivities` conforme `viewer` flags em `DashboardPage.tsx`/widgets

**Checkpoint**: escopo por papel garantido ponta a ponta (US1+US2).

---

## Phase 5: User Story 3 - Admin alterna "Toda a clínica / Somente meus" (P2)

**Goal**: admin alterna escopo nos widgets escopáveis; secretário não vê o toggle.

**Independent Test**: admin `scope=mine` muda contagens; `scope=clinic` volta ao total; secretário ignora `mine`.

- [x] T026 [US3] Honrar `scope=clinic|mine` (admin) nas queries de cards/próximas consultas no `DashboardService`/`DashboardRepository` (FR-004)
- [x] T027 [P] [US3] Componente `resources/js/components/clinic/dashboard/ScopeToggle.tsx` e refetch dos widgets escopáveis ao alternar (passa `scope` no `queryKey`)
- [x] T028 [US3] Feature test: admin `mine` vs `clinic`; secretário ignora `mine` em `modules/Clinic/tests/Feature/Dashboard/DashboardScopeTest.php`

**Checkpoint**: admin-atendente consegue focar nos próprios números.

---

## Phase 6: User Story 4 - Taxa de ocupação por fisioterapeuta e período (P2)

**Goal**: gráfico de ocupação com Diária/Semanal/Mensal e seleção de fisioterapeuta.

**Independent Test**: selecionar fisio + granularidade → buckets e `occupied_rate` corretos; fisioterapeuta sem seletor (só ele).

- [x] T029 [US4] Editar a migration `modules/Clinic/database/migrations/2026_02_27_000002_create_clinics_table.php` adicionando `working_start`/`working_end`/`working_days` e criar helper `Clinic::workingWindow()` em `modules/Clinic/app/Models/Clinic.php` — data-model §2
- [x] T030 [US4] Criar `modules/Clinic/app/Services/OccupancyRateService.php` (buckets por granularidade + `rate = Σ duração ÷ Σ janela`) — research §9, FR-019a/b
- [x] T031 [US4] Criar `modules/Clinic/app/Http/Requests/OccupancyRateRequest.php` + action `occupancyRate` no `DashboardController` + queries no `DashboardRepository` (forçar fisio a si; admin/secretário escolhem — FR-020)
- [x] T032 [P] [US4] Unit test `OccupancyRateService` (numerador/denominador, 3 granularidades, janela default) em `modules/Clinic/tests/Unit/OccupancyRateServiceTest.php`
- [x] T033 [P] [US4] Feature test: autorização da ocupação (fisioterapeuta forçado a si) em `modules/Clinic/tests/Feature/Dashboard/OccupancyRateTest.php`
- [x] T034 [US4] Componente `resources/js/components/clinic/dashboard/OccupancyRateChart.tsx` (Chart.js) com abas de granularidade + seletor de profissional (reusa `GET /clinic/users/professionals`) + hook `useOccupancyRate` (FR-021/SC-007)

**Checkpoint**: indicador gerencial de ocupação completo.

---

## Phase 7: User Story 5 - Aniversariantes do mês com WhatsApp (P2)

**Goal**: lista de aniversariantes do mês, escopada por papel, com botão WhatsApp Web.

**Independent Test**: lista ordenada por dia, escopo por papel; botão abre `wa.me?text=` com parabéns; sem telefone → desabilitado.

- [x] T035 [US5] Adicionar agregação de aniversariantes ao `DashboardRepository`/`DashboardService` (mês corrente tz clínica, escopo por papel, `name/photo/day/phone`) — FR-012/013, contracts §1
- [x] T036 [P] [US5] Componente `resources/js/components/clinic/dashboard/MonthBirthdays.tsx` com botão que abre WhatsApp Web em nova aba (`https://wa.me/<digits>?text=<parabéns URL-encoded>`) e desabilita quando `can_message=false` (FR-014)
- [x] T037 [P] [US5] Feature test: aniversariantes escopados por papel em `modules/Clinic/tests/Feature/Dashboard/BirthdaysTest.php`

**Checkpoint**: relacionamento de aniversário operável.

---

## Phase 8: User Story 6 - Captação de pacientes por origem (P3)

**Goal**: comparação dos últimos 3 anos por origem (separados + consolidado), escopada por papel.

**Independent Test**: matriz anos×origens com `count`/`percent`; sem origem → "Não informado"; fisio só os seus.

- [x] T038 [US6] Criar `modules/Clinic/app/Http/Requests/PatientAcquisitionRequest.php` + action `patientAcquisition` no `DashboardController` + query no `DashboardRepository` (group by `referral_source`, base `created_at`, 3 anos + consolidado, `null→"Não informado"`) — FR-015/016/017, contracts §3
- [x] T039 [P] [US6] Componente `resources/js/components/clinic/dashboard/PatientAcquisitionChart.tsx` (Chart.js — comparação 3 anos) + tabela + hook `usePatientAcquisition`
- [x] T040 [P] [US6] Feature test: captação escopada por papel + bucket "Não informado" em `modules/Clinic/tests/Feature/Dashboard/PatientAcquisitionTest.php`

**Checkpoint**: indicador analítico de captação.

---

## Phase 9: User Story 7 - Feed de Atividades recentes + log (P3)

**Goal**: feed do dia (admin/secretário) alimentado por um log dedicado gravado nas ações de domínio.

**Independent Test**: ações do dia aparecem no feed (desc, ator, tempo); fisioterapeuta → 403/oculto; dia vazio → empty state.

- [x] T041 [US7] Criar migration `modules/Clinic/database/migrations/2026_06_19_000001_create_clinic_activities_table.php` + model `modules/Clinic/app/Models/ClinicActivity.php` + enum `modules/Clinic/app/Enums/ActivityType.php` (8 tipos) — data-model §1, FR-022a/b
- [x] T042 [US7] Criar `ActivityLoggerInterface` (`modules/Clinic/app/Contracts/`) + `ActivityLogger` (`modules/Clinic/app/Services/`) + bind no `ClinicServiceProvider`
- [x] T043 [US7] Instrumentar eventos chamando o `ActivityLogger` em: `modules/Patient/app/Services/PatientService.php` (create/update), `modules/Clinic/app/Services/TreatmentPlanService.php` (create/update→completed/addExercise), `modules/Clinic/app/Services/AppointmentService.php` (create/updateStatus→completed/cancel) — research §11
- [x] T044 [US7] Action `activities` no `DashboardController` + query no `DashboardRepository` (hoje, clínica inteira, `created_at DESC`) com **403 para fisioterapeuta** (FR-023, contracts §4)
- [x] T045 [P] [US7] Componente `resources/js/components/clinic/dashboard/RecentActivities.tsx` + hook `useRecentActivities` (só admin/secretário; empty state — FR-024)
- [x] T046 [P] [US7] Feature test: feed lista eventos + fisioterapeuta 403 + empty state em `modules/Clinic/tests/Feature/Dashboard/ActivitiesTest.php`

**Checkpoint**: todas as 7 user stories independentemente funcionais.

---

## Phase 10: Polish & Cross-Cutting

- [x] T047 [P] Testes frontend: mapping do `api-clinic-dashboard` (snake→camel) e estados loading/empty/error dos widgets em `resources/js/test/` (SC-006/FR-029)
- [x] T048 [P] Rodar `npm run types && npm run lint && ./vendor/bin/pint`
- [x] T049 Executar os cenários de validação do [quickstart.md](./quickstart.md) por papel
- [x] T050 [P] Revisar degradação graciosa: falha de um widget não derruba os demais (cada hook com `queryKey` próprio) — SC-006

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: sem dependências.
- **Foundational (P2)**: depende do Setup; **bloqueia** todas as user stories.
- **User Stories (P3+)**: dependem da Foundational. US1 e US2 compartilham o agregador (US2 reforça o escopo já criado na fundação). US3–US7 são independentes entre si.
- **Polish (P10)**: depois das stories desejadas.

### User Story Dependencies

- **US1 (P1)**: após Foundational. Base do agregador.
- **US2 (P1)**: após Foundational; reforça/valida escopo (toca os mesmos arquivos de US1 — fazer logo após US1).
- **US3 (P2)**: após US1 (estende cards/upcoming com `scope`).
- **US4 (P2)**: independente (endpoint próprio + migration de `clinics`).
- **US5 (P2)**: estende o agregador (toca `DashboardService` — coordenar com US1).
- **US6 (P3)**: independente (endpoint próprio).
- **US7 (P3)**: independente (tabela/log próprios + instrumentação).

### Within Each Story

- Backend: Model/Migration → Repository → Service → Request/Controller → Test.
- Frontend: hook (application) → componente → composição na page.

### Parallel Opportunities

- Setup: T001, T002 em paralelo.
- Foundational: T004 + T010 + T011 em paralelo (contracts back / domain+port front).
- US1: T017, T018, T019 (componentes) em paralelo; T022 (teste) em paralelo com a UI.
- US4: T032, T033 (testes) em paralelo.
- US6/US7: componentes e testes marcados [P].
- Com time: após Foundational, US4, US6, US7 podem ir em paralelo por devs distintos; US1→US2→US3 ficam com um mesmo dev (tocam arquivos comuns do agregador).

---

## Parallel Example: User Story 1

```bash
# Componentes de widget (arquivos distintos):
Task: "StatCards.tsx"            # T017
Task: "UpcomingAppointments.tsx" # T018
Task: "QuickActions.tsx"         # T019
# Em paralelo ao teste de backend:
Task: "Feature test DashboardAggregateTest.php"  # T022
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **validar** painel admin/secretário → demo.

### Incremental Delivery

US1 (MVP) → US2 (privacidade por papel) → US3 (toggle admin) → US4 (ocupação) → US5 (aniversariantes) → US6 (captação) → US7 (atividades). Cada story agrega valor sem quebrar as anteriores.

---

## Notes

- `[P]` = arquivos distintos, sem dependência pendente.
- US1 e US2 são ambos P1 (privacidade por papel é pré-requisito real); entregar juntos como MVP completo.
- Backend é fonte de verdade do escopo (T023/T024 garantem SC-004) — UI só esconde.
- Migrations editadas/criadas → `php artisan migrate:fresh` (convenção dev).
- Commit por task ou grupo lógico; parar nos checkpoints para validar a story.
