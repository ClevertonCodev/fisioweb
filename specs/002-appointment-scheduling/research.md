# Phase 0 — Research & Decisões Técnicas

Feature: Agendamento de Consultas com Google Calendar · Branch `002-appointment-scheduling`

As decisões de produto já foram fixadas em `spec.md` (seção Clarifications). Este documento resolve as escolhas **técnicas** necessárias para o plano.

## 1. SDK / pacote para Google Calendar

- **Decisão**: usar `google/apiclient` (Google API PHP Client oficial) para OAuth2 (web flow) e Google Calendar API v3.
- **Rationale**: o projeto não tem Socialite nem pacote Google instalado (verificado em `composer.json`). O `google/apiclient` cobre tanto o fluxo OAuth (gerar URL de consentimento, trocar code por token, refresh) quanto as chamadas de Calendar (events.insert/update/delete, events.list com `syncToken`). Evita acoplar Socialite só para login.
- **Alternativas consideradas**:
  - *laravel/socialite + chamadas HTTP manuais ao Calendar*: Socialite resolve só o login, não a Calendar API; sobraria muito HTTP manual.
  - *spatie/laravel-google-calendar*: orientado a um service-account/calendário único; não encaixa no modelo "1 conta OAuth por usuário".

## 2. Modelo OAuth: por usuário (FR-013/FR-014)

- **Decisão**: cada `ClinicUser` conecta a própria conta via OAuth2 Authorization Code. Tokens (`access_token`, `refresh_token`, `expiry`, `calendar_id`, `sync_token`) ficam no próprio `clinic_users` (colunas novas), pois é 1:1 com o usuário e simples.
- **Rationale**: relação 1:1 usuário↔conexão; sem necessidade de tabela separada. Mantém o vínculo junto do dono. Escopo OAuth: `https://www.googleapis.com/auth/calendar` (ou `calendar.events`).
- **Fluxo**: `GET /clinic/google-calendar/connect` → redireciona para consentimento Google → `GET /clinic/google-calendar/callback?code=...` troca por tokens e salva → `DELETE /clinic/google-calendar` revoga/limpa. `refresh_token` obtido com `access_type=offline` + `prompt=consent`.
- **Alternativas**: tabela `clinic_user_google_accounts` dedicada — adia para quando houver multi-conta por usuário (YAGNI agora).

## 3. Sync reverso: polling (Clarification #1)

- **Decisão**: `PullGoogleCalendarJob` despachado por um Command agendado (`registerCommandSchedules` no `ClinicServiceProvider`) a cada ~5 min, iterando usuários conectados e usando **incremental sync tokens** do Calendar API (`events.list` com `syncToken`; em `410 Gone`, full resync e novo token).
- **Rationale**: sem webhook/endpoint público (ambiente dev sem URL exposta). Sync tokens minimizam payload e duplicação. Latência ~5 min é aceitável (SC-004).
- **Idempotência**: correlação por `google_event_id` na consulta; upsert por esse id evita duplicar. Eventos do Google sem consulta correspondente entram como "evento externo" (sem `patient_id`).
- **Alternativas**: webhook push (descartado — exige HTTPS público e renovação de canais); sync manual sob demanda (pior UX, descartado na clarificação).

## 4. Push ao Google: Job assíncrono (FR-015/FR-022)

- **Decisão**: `SyncAppointmentToGoogleJob` (ação `create|update|delete`) despachado **afterCommit** ao salvar/cancelar uma consulta cujo responsável tem Google conectado. Retry com backoff; `failed()` registra sem corromper a consulta.
- **Rationale**: a consulta é fonte de verdade e não pode falhar por causa do Google (FR-015/FR-022). Fila `database` (default do projeto). `afterCommit` garante que a transação já persistiu.
- **Deduplicação**: ao criar, guarda `google_event_id` retornado; updates/cancel usam esse id. Um flag/`updated_at` evita loop push↔pull (origem da mudança marcada para o pull ignorar o que ele mesmo escreveu).

## 5. Fuso horário (Clarification #2)

- **Decisão**: armazenar `starts_at`/`ends_at` em UTC (timestamps Eloquent). Converter para o fuso da clínica na exibição. Ao enviar ao Google, usar `dateTime` ISO‑8601 com `timeZone` explícito da clínica.
- **Rationale**: padrão robusto a horário de verão e a múltiplos fusos. O fuso da clínica vem de config/coluna da `Clinic` (default `America/Sao_Paulo` se ausente).
- **Frontend**: `domain` mantém strings ISO (UTC); a camada de UI formata no fuso local — consistente com o mock atual que usa ISO.

## 6. Máquina de estados de status (Clarification #4 / FR-023)

- **Decisão**: `AppointmentStatus` como **enum PHP** (`php-modern`) com método `canTransitionTo()` codificando: `scheduled→{confirmed,cancelled,no_show*,completed*}`, `confirmed→{cancelled,no_show*,completed*}`, terminais `{completed,no_show,cancelled}` sem retorno; `no_show`/`completed` (*) só permitidos se `now >= starts_at`. Validação no `AppointmentService`, rejeição → 422.
- **Rationale**: regra de negócio crítica no backend (gate 1). Enum centraliza cores/labels e transições, espelhando `STATUS_COLORS` do frontend.

## 7. Cancelamento vs exclusão (Clarification #3 / FR-024)

- **Decisão**: sem hard delete. `POST /clinic/appointments/{id}/cancel` muda status para `cancelled` e despacha `SyncAppointmentToGoogleJob(delete)` (remove o evento no Google). A consulta permanece no histórico.
- **Rationale**: preserva auditoria; alinhado à clarificação. A rota `apiResource` não exporá `destroy` (ou ele retorna 405/redireciona a cancel).

## 8. Migrations (Constraint do usuário)

- **Decisão**: **não** criar migration de alteração para os campos Google — editar a migration existente `2026_02_27_000003_create_clinic_users_table.php` adicionando as colunas (`google_*`). Criar **uma** migration nova `create_clinic_appointments_table` (tabela inexistente). Recriar o banco com `php artisan migrate:fresh`.
- **Rationale**: usuário confirmou ambiente em desenvolvimento, sem produção/teste; prefixo `clinic_` por convenção (memória de case-sensitivity). Para tabela nova não há como evitar uma create migration.

## 9. Autorização (FR-009/FR-010/FR-011/FR-012)

- **Decisão**: `AppointmentPolicy` + `Gate::before` (admin/mestre). Regras: admin/secretário → CRUD em qualquer consulta da própria clínica; fisioterapeuta → só consultas onde `clinic_user_id === user.id`. `StoreAppointmentRequest` força `clinic_user_id = auth user` quando role=fisioterapeuta; Service revalida (defesa em profundidade). Listagem e selects filtrados por papel no Repository/Service.
- **Rationale**: espelha o padrão `security` skill (Policy autoritativa + frontend só esconde). Secretário equiparado a admin (Assumption do spec).

## 10. Frontend — religar mock

- **Decisão**: novo `appointments-repository.ts` (infra) usando `apiClient` com mappers snake_case↔camelCase; `ports.ts` ganha CRUD (`create/update/cancel/updateStatus/list/listClinicUsers/listAgendaPatients`); `use-appointments.ts` troca mock por repo real + mutations com invalidação de `['appointments']`; `AppointmentModal` vira RHF+Zod; remover `mock-appointments.ts` e `sendCalendarInvite` do domain.
- **Rationale**: a estrutura visual (CalendarView/Sidebar/cores/visões) já existe; só falta a camada de dados real. Segue DDD do projeto.

## Itens NEEDS CLARIFICATION restantes

Nenhum. Todas as incógnitas técnicas e de produto foram resolvidas (spec Clarifications + decisões acima).
