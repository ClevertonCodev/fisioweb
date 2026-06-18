---
description: "Task list for Agendamento de Consultas com Google Calendar"
---

# Tasks: Agendamento de Consultas com Google Calendar

**Input**: Design documents from `specs/002-appointment-scheduling/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Incluídas — o projeto usa PHPUnit (`modules/Clinic/tests/`) e Vitest (`resources/js/test/`), e o quickstart prevê cobertura. São opcionais por fase, mas recomendadas.

**Organization**: Tarefas agrupadas por user story. Ordem geral: **backend primeiro**, depois religar o frontend (preferência do usuário).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências pendentes)
- **[Story]**: US1..US5 conforme spec.md

## Path Conventions

- Backend: `modules/Clinic/app/...`, `modules/Clinic/database/migrations/`, `modules/Clinic/routes/clinic.php`, testes em `modules/Clinic/tests/`
- Frontend: `resources/js/{domain,application,infrastructure,components,pages}/clinic/...`, testes em `resources/js/test/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependências e configuração necessárias para toda a feature

- [x] T001 Adicionar o pacote `google/apiclient` via `composer require google/apiclient` e confirmar no `composer.json`
- [x] T002 [P] Adicionar variáveis OAuth ao `.env.example` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) e criar `config/services.php` entry `google` (client_id/secret/redirect)
- [x] T003 [P] Definir o fuso da clínica: inspecionar a migration `create_clinics_table`/model `Clinic`; **se não houver** coluna de timezone, editar a migration existente de `clinics` adicionando `timezone` (default `America/Sao_Paulo`) e expor no model — sem migration de alteração (recriar com `migrate:fresh`), conforme research.md §5/§8

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Base que TODAS as user stories dependem (modelo, schema, enum, repositório, autorização, rotas)

**⚠️ CRITICAL**: Nenhuma user story começa antes desta fase

- [x] T004 Criar migration `modules/Clinic/database/migrations/2026_06_16_000001_create_clinic_appointments_table.php` conforme data-model.md (colunas, FKs, índices)
- [x] T005 Editar a migration existente `modules/Clinic/database/migrations/2026_02_27_000003_create_clinic_users_table.php` adicionando colunas Google (`google_access_token`, `google_refresh_token`, `google_token_expires_at`, `google_calendar_id`, `google_sync_token`, `google_connected_at`) — sem migration de alteração (research.md §8)
- [x] T006 [P] Criar enum `modules/Clinic/app/Enums/AppointmentStatus.php` com valores, labels, cores e `canTransitionTo(self $to, Carbon $startsAt, Carbon $now): bool` (FR-023, data-model.md)
- [x] T007 Criar model `modules/Clinic/app/Models/Appointment.php` (tabela `clinic_appointments`, fillable, casts incl. enum + datetimes, relações `clinic`/`patient`/`clinicUser`)
- [x] T008 [P] Estender `modules/Clinic/app/Models/ClinicUser.php`: casts `encrypted` dos tokens Google, `$hidden`, accessor `isGoogleConnected()`, relação `hasMany(Appointment, 'clinic_user_id')`
- [x] T009 [P] Criar `modules/Clinic/app/Contracts/AppointmentRepositoryInterface.php` e `modules/Clinic/app/Contracts/AppointmentServiceInterface.php`
- [x] T010 Criar `modules/Clinic/app/Repositories/AppointmentRepository.php` (CRUD + listagem com filtros `from/to/clinic_user_id/status`, sempre por `clinic_id`)
- [x] T011 Criar `modules/Clinic/app/Policies/AppointmentPolicy.php` (viewAny/view/create/update/cancel com ownership por `clinic_id` + papel) conforme research.md §9
- [x] T012 Registrar no `modules/Clinic/app/Providers/ClinicServiceProvider.php`: bind do `AppointmentRepositoryInterface` + `Gate::policy(Appointment::class, AppointmentPolicy::class)` (bind do Service entra na US1; integração Google fica no módulo GoogleCalendar)
- [x] T013 Adicionar grupo de rotas `appointments` (apiResource sem destroy) em `modules/Clinic/routes/clinic.php` (as rotas `google-calendar` vão para o módulo GoogleCalendar — US4)
- [x] T014 [P] Criar Factory `modules/Clinic/database/factories/AppointmentFactory.php` para testes
- [x] T015 Rodar `php artisan migrate:fresh` e confirmar schema (clinic_appointments + colunas Google)

**Checkpoint**: Modelo, schema, enum, repositório, policy e rotas prontos — user stories podem começar

---

## Phase 3: User Story 1 - Agendar uma consulta (Priority: P1) 🎯 MVP

**Goal**: Criar consulta (botão e slot do calendário), status inicial `scheduled`, com validação e disparo de notificação.

**Independent Test**: `POST /clinic/appointments` válido cria consulta `scheduled` e ela aparece em `GET`; término ≤ início → 422.

### Tests for User Story 1

- [x] T016 [P] [US1] Feature test de criação em `modules/Clinic/tests/Feature/AppointmentStoreTest.php` (201, status scheduled, envelope `data`, 422 quando `ends_at <= starts_at`)
- [x] T017 [P] [US1] Unit test do `AppointmentService::create` em `modules/Clinic/tests/Unit/AppointmentServiceCreateTest.php` (mock Repository)

### Implementation for User Story 1 (backend)

- [x] T018 [US1] Criar `modules/Clinic/app/Http/Requests/StoreAppointmentRequest.php` (regras: campos, `ends_at > starts_at`, paciente/fisio da clínica)
- [x] T019 [US1] Criar `modules/Clinic/app/Services/AppointmentService.php` método `create()` (força `scheduled`, persiste em UTC, dispara notificação afterCommit; ponto de extensão para push Google em US4)
- [x] T020 [US1] Criar `modules/Clinic/app/Jobs/AppointmentScheduledNotificationJob.php` (enfileira aviso fisio+paciente; entrega de canal fora de escopo — FR-020)
- [x] T021 [US1] Criar `modules/Clinic/app/Http/Controllers/AppointmentController.php` método `store()` (injeta clinic_id/regra de papel, retorna `data`) e **aplicar a `AppointmentPolicy` desde já** (`$this->authorize('create', Appointment::class)`) — garante que o MVP da US1 já vai com autorização no controller (FR-011)

### Implementation for User Story 1 (frontend)

- [x] T022 [P] [US1] Ajustar `resources/js/domain/clinic/appointment.ts` (remover `sendCalendarInvite`) e adicionar DTOs de escrita em `resources/js/application/clinic/ports.ts` (`AppointmentWriteDto`)
- [x] T023 [US1] Criar `resources/js/infrastructure/repositories/appointments-repository.ts` (apiClient + mappers snake↔camel) com `create()`; registrar em `resources/js/infrastructure/repositories/index.ts`
- [x] T024 [US1] Atualizar `resources/js/application/clinic/use-appointments.ts` com `useCreateAppointment` (mutation + invalidação `['appointments']`)
- [x] T025 [US1] Converter `resources/js/components/clinic/agenda/AppointmentModal.tsx` para RHF + Zod (paciente, fisioterapeuta, início, término, título, observações, local) chamando o create; abrir via botão "Nova Consulta" e via clique no slot

**Checkpoint**: Criação de consulta funcional ponta-a-ponta (MVP)

---

## Phase 4: User Story 2 - Visualizar e filtrar a agenda conforme o papel (Priority: P1)

**Goal**: Listar consultas em Mês/Semana/Dia/Lista, filtrar por fisioterapeuta e status, com visibilidade por papel.

**Independent Test**: fisioterapeuta vê só as próprias; admin/secretário vê todas; filtros e visões mantêm coerência.

### Tests for User Story 2

- [x] T026 [P] [US2] Feature test de listagem/visibilidade em `modules/Clinic/tests/Feature/AppointmentIndexVisibilityTest.php` (fisio só as dele; admin todas; filtros `clinic_user_id`/`status`/`from`/`to`)

### Implementation for User Story 2 (backend)

- [x] T027 [US2] Implementar `AppointmentService::list()` + filtro por papel (admin/secretário = clínica toda; fisioterapeuta = só `clinic_user_id` próprio) em `modules/Clinic/app/Services/AppointmentService.php`
- [x] T028 [US2] Implementar `AppointmentController::index()` (query `from/to/clinic_user_id/status`) em `modules/Clinic/app/Http/Controllers/AppointmentController.php`
- [x] T029 [US2] Ajustar `GET /clinic/users/professionals` (ClinicUserController) para, quando o autor é fisioterapeuta, retornar apenas ele (FR-012)

### Implementation for User Story 2 (frontend)

- [x] T030 [US2] Adicionar `list(params)`/`listClinicUsers()`/`listAgendaPatients()` ao `appointments-repository.ts` e remover `resources/js/infrastructure/repositories/mock-appointments.ts`
- [x] T031 [US2] Atualizar `use-appointments.ts` (`useAppointments` com filtros, `useClinicUsers`, `useAgendaPatients`) para usar o repo real
- [x] T032 [US2] Religar `resources/js/components/clinic/agenda/CalendarView.tsx` (Mês/Semana/Dia/Lista) e `CalendarSidebar.tsx` (filtros fisioterapeuta + status) a dados reais
- [x] T033 [US2] Atualizar loader em `resources/js/pages/clinic/AgendaPage.tsx` para chamar a camada `application/` (sem `apiClient` direto)

**Checkpoint**: Agenda exibe dados reais com filtros e visibilidade por papel

---

## Phase 5: User Story 3 - Autorização ao marcar horário (Priority: P1)

**Goal**: Garantir no backend que fisioterapeuta só marca/edita para si; admin/secretário para qualquer um.

**Independent Test**: fisioterapeuta enviando `clinic_user_id` de outro → 403; admin/secretário aceito.

### Tests for User Story 3

- [x] T034 [P] [US3] Feature test de autorização em `modules/Clinic/tests/Feature/AppointmentAuthorizationTest.php` (fisio→forçado p/ si; admin/secretário ok; cross-clinic = 422) — cobre SC-003

### Implementation for User Story 3 (backend)

- [x] T035 [US3] Reforçar `StoreAppointmentRequest`/`AppointmentService::create` para forçar `clinic_user_id = auth()->id()` quando papel = fisioterapeuta, e revalidar pertencimento à clínica (defesa em profundidade)
- [x] T036 [US3] Estender a aplicação de `authorize`/Policy em `AppointmentController` aos demais métodos (update/cancel/view/index) garantindo ownership por `clinic_id` + papel — Policy reforçada com isolamento multi-tenant + guard `clinic_id` no controller (contra o bypass de admin no Gate::before)

### Implementation for User Story 3 (frontend)

- [x] T037 [US3] No `AppointmentModal.tsx`, fixar o campo Fisioterapeuta no próprio usuário quando papel = fisioterapeuta (UI apenas; backend é autoritativo) — via `lockedClinicUserId` derivado do `useAuth`

**Checkpoint**: Regras de autorização aplicadas e testadas (frontend esconde, backend protege)

---

## Phase 6: User Story 5 - Atualizar status e dados da consulta (Priority: P2)

**Goal**: Editar dados e mudar status com transições válidas; cancelar (sem hard delete).

**Independent Test**: `scheduled→confirmed` muda cor; `completed`/`no_show` antes do início → 422; `cancelled→scheduled` → 422; cancelar mantém histórico.

### Tests for User Story 5

- [x] T038 [P] [US5] Unit test das transições (matriz de transições + regra de horário) — coberto por `modules/Clinic/tests/Unit/AppointmentStatusTest.php` (foundation) + casos de feature em `AppointmentUpdateStatusTest`
- [x] T039 [P] [US5] Feature test de status/edição/cancel em `modules/Clinic/tests/Feature/AppointmentUpdateStatusTest.php`

### Implementation for User Story 5 (backend)

- [x] T040 [P] [US5] Criar `modules/Clinic/app/Http/Requests/UpdateAppointmentRequest.php` e `UpdateAppointmentStatusRequest.php`
- [x] T041 [US5] Implementar `AppointmentService::update()`, `updateStatus()` (valida via enum `canTransitionTo`), `cancel()` (status `cancelled`, sem delete) em `AppointmentService.php`
- [x] T042 [US5] Implementar endpoints `update` (PUT), `updateStatus` (PATCH `/status`), `cancel` (POST `/cancel`) no `AppointmentController` e rotas correspondentes em `clinic.php`

### Implementation for User Story 5 (frontend)

- [x] T043 [US5] Adicionar `update()`, `updateStatus()`, `cancel()` ao `appointments-repository.ts` e mutations em `use-appointments.ts`
- [x] T044 [US5] Permitir abrir consulta existente no `AppointmentModal.tsx` (modo edição) com troca de status (refletindo cor de `STATUS_COLORS`) e ação de cancelar

**Checkpoint**: Ciclo de vida da consulta completo (criar→confirmar→concluir/cancelar)

---

## Phase 7: User Story 4 - Conectar Google e sincronizar bidirecionalmente (Priority: P2)

**Goal**: Cada usuário conecta a própria conta Google; push (sistema→Google) e pull (Google→sistema por polling) por usuário.

**Independent Test**: conectar conta, criar consulta → evento no Google em ~1 min; criar evento no Google → aparece no sistema após polling; sem duplicação.

### Tests for User Story 4

- [x] T045 [P] [US4] Feature test de conexão/desconexão em `modules/GoogleCalendar/tests/Feature/GoogleCalendarConnectionTest.php` (status, callback salva tokens no `clinic_users`, disconnect limpa)
- [x] T046 [P] [US4] Unit test de push com `Queue::fake` + `assertPushed` em `modules/GoogleCalendar/tests/Unit/SyncAppointmentToGoogleJobTest.php` (dispatch só quando responsável conectado; idempotência por `google_event_id`)

### Implementation for User Story 4 (backend)

- [x] T046b [US4] **Scaffold do módulo** `modules/GoogleCalendar` (estrutura nwidart: `module.json`, `composer.json` com PSR-4, `GoogleCalendarServiceProvider`, `RouteServiceProvider`, `config/config.php` lendo `services.google`); ativar em `modules_statuses.json` e rodar `composer update` para o merge do autoload
- [x] T047 [US4] Criar `modules/GoogleCalendar/app/Contracts/GoogleCalendarServiceInterface.php` e `modules/GoogleCalendar/app/Services/GoogleCalendarService.php` (OAuth URL, troca de code, refresh, events insert/update/delete, events.list com syncToken) usando `google/apiclient`; bind no provider do módulo
- [x] T048 [US4] Criar `modules/GoogleCalendar/app/Http/Controllers/GoogleCalendarController.php` (`connect`, `callback`, `disconnect`, `status`) conforme contracts/google-calendar.md, persistindo tokens no `ClinicUser`; rotas em `modules/GoogleCalendar/routes/api.php` (prefixo `clinic/google-calendar`, middleware `auth:clinic` + `clinic.guard`)
- [x] T049 [US4] Criar `modules/GoogleCalendar/app/Jobs/SyncAppointmentToGoogleJob.php` (ações create/update/delete; grava `google_event_id`/`last_synced_at` na consulta; retry/backoff/failed) — FR-015/FR-022
- [x] T050 [US4] Integrar dispatch do push (afterCommit) em `AppointmentService::create/update/cancel` (Clinic) despachando `Modules\GoogleCalendar\Jobs\SyncAppointmentToGoogleJob` quando `clinicUser->isGoogleConnected()` (FR-014/FR-018/FR-024)
- [x] T051 [US4] Criar `modules/GoogleCalendar/app/Jobs/PullGoogleCalendarJob.php` (por usuário conectado, syncToken incremental, upsert por `google_event_id`, `source='google'`, full resync em 410, anti-loop) — FR-016/FR-017
- [x] T052 [US4] Criar Command `modules/GoogleCalendar/app/Console/Commands/PullGoogleCalendarCommand.php` e agendá-lo (~5 min) no `GoogleCalendarServiceProvider` do módulo

### Implementation for User Story 4 (frontend)

- [x] T053 [P] [US4] Criar `resources/js/infrastructure/repositories/api-google-calendar.ts` (connect/status/disconnect via apiClient) + porta em `ports.ts` + hooks em `application/clinic`
- [x] T054 [US4] Adicionar no cadastro de usuário (`UserEditPage`, apenas no próprio perfil) o controle "Conectar/Desconectar Google Calendar" exibindo o status

**Checkpoint**: Sincronização bidirecional por usuário funcionando

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T055 [P] Rodar `./vendor/bin/pint` nos arquivos da feature (backend) — novos arquivos formatados; pendências de Pint restantes são em arquivos pré-existentes fora do escopo
- [x] T056 [P] Garantir `npm run types` sem erros após remoção do mock e novos DTOs
- [x] T057 [P] Teste de Repository frontend em `resources/js/test/api-clinic-appointments.test.ts` (mock apiClient: list/create/update/updateStatus/cancel)
- [ ] T058 [P] Teste do `AppointmentModal` (RHF+Zod) em `resources/js/test/` (validação término>início, submit)
- [ ] T059 Executar validações do `specs/002-appointment-scheduling/quickstart.md` (cenários 1–7) — requer credenciais Google reais para US4
- [x] T060 Revisão de segurança: isolamento multi-tenant em todos os endpoints (Policy + guard `clinic_id` no controller contra bypass de admin no Gate::before) e ausência de `DELETE` de consulta (FR-024) — coberto por `AppointmentUpdateStatusTest::test_cannot_touch_appointment_of_another_clinic` e `AppointmentIndexVisibilityTest::test_index_does_not_leak_other_clinic_appointments`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências
- **Foundational (Phase 2)**: depende do Setup — BLOQUEIA todas as stories
- **User Stories (Phase 3+)**: dependem da Foundational
  - US1, US2, US3 (P1) são o núcleo; US3 reforça regras introduzidas em US1/US2
  - US5 (P2) depende do model/enum (Foundational) e dos endpoints base (US1)
  - US4 (P2) é a integração mais pesada; pode ser a última. O dispatch de push (T050) integra com `AppointmentService` de US1/US5
- **Polish (Phase 8)**: depende das stories desejadas

### User Story Dependencies

- **US1 (P1)**: após Foundational — base do CRUD
- **US2 (P1)**: após Foundational — usa o model; idealmente após US1 (compartilha controller/service)
- **US3 (P1)**: após US1/US2 (reforça Request/Policy já criados)
- **US5 (P2)**: após US1 (estende service/controller)
- **US4 (P2)**: após US1/US5 para integrar dispatch (T050); conexão e pull são independentes

### Within Each User Story

- Tests primeiro (devem falhar) → backend (Model→Service→Controller) → frontend (domain→infra→application→page/componentes)

### Parallel Opportunities

- Setup: T002, T003 em paralelo
- Foundational: T006, T008, T009, T014 em paralelo (arquivos distintos) após T004/T005/T007
- Tests marcados [P] de cada story rodam juntos
- Frontend T022 [P] em paralelo com backend da US1

---

## Parallel Example: User Story 1

```bash
# Tests da US1 juntos:
Task: "Feature test de criação em modules/Clinic/tests/Feature/AppointmentStoreTest.php"
Task: "Unit test do AppointmentService::create em modules/Clinic/tests/Unit/AppointmentServiceCreateTest.php"

# Domain/DTO em paralelo ao backend:
Task: "Ajustar domain/clinic/appointment.ts + DTOs em application/clinic/ports.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1)
2. **PARAR e VALIDAR**: criar consulta ponta-a-ponta
3. Demo do MVP

### Incremental Delivery (ordem recomendada — backend primeiro)

1. Setup + Foundational → base pronta
2. US1 (criar) → US2 (listar/filtrar/visibilidade) → US3 (autorização) — entrega o núcleo P1
3. US5 (status/edição/cancelamento) — ciclo de vida completo
4. US4 (Google connect + push + pull) — integração bidirecional
5. Polish

### Parallel Team Strategy

- Após Foundational: Dev A em US1/US2/US3 (núcleo), Dev B prepara US4 (GoogleCalendarService/OAuth) em paralelo, integrando o dispatch (T050) quando US1/US5 estiverem prontos.

---

## Notes

- [P] = arquivos diferentes, sem dependências pendentes
- Backend é fonte de verdade (autorização/transições/validação); frontend só esconde para UX
- Sem hard delete de consulta (FR-024); `DELETE` não é exposto
- Horários em UTC; exibir no fuso da clínica; enviar tz explícito ao Google
- Sem migration de alteração: editar `create_clinic_users_table` e recriar com `migrate:fresh`
- Commit após cada task ou grupo lógico
