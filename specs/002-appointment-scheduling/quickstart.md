# Quickstart — Validação da feature Agendamento + Google Calendar

Guia de validação ponta-a-ponta. Detalhes de schema em [data-model.md](./data-model.md); endpoints em [contracts/](./contracts/).

## Pré-requisitos

```bash
composer install && npm install
# Adicionar pacote Google (Phase 2 / implementação):
composer require google/apiclient

# .env — credenciais OAuth do Google Cloud (projeto com Calendar API habilitada):
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# GOOGLE_REDIRECT_URI=http://localhost:8000/clinic/google-calendar/callback

php artisan migrate:fresh --seed   # recria DB (inclui colunas Google em clinic_users + clinic_appointments)
composer run dev                   # Laravel + queue + Pail + Vite
```

> Observação: por estar em desenvolvimento, os campos Google entram editando a migration de `clinic_users` e a tabela `clinic_appointments` é nova — `migrate:fresh` recria tudo (sem migration de alteração).

## Cenário 1 — Criar consulta (P1, US1)

1. Autentique como secretário/admin da clínica.
2. `POST /clinic/appointments` com `patient_id`, `clinic_user_id`, `starts_at < ends_at`.
3. **Esperado**: `201`, status `scheduled`, aparece em `GET /clinic/appointments?from&to`. Na UI: bloco azul (Agendada) no calendário.
4. Validação negativa: `ends_at <= starts_at` → `422` (FR-003).

## Cenário 2 — Visibilidade por papel (P1, US2)

1. Como **fisioterapeuta**, `GET /clinic/appointments` → só retorna consultas onde ele é responsável (FR-009).
2. Como **admin/secretário** → retorna todas; `?clinic_user_id=X` filtra por profissional; `?status=confirmed` filtra por status.
3. Alternar Mês/Semana/Dia/Lista na UI mantém o mesmo conjunto filtrado (SC-006).

## Cenário 3 — Autorização ao marcar (P1, US3)

1. Como fisioterapeuta, enviar `POST` com `clinic_user_id` de **outro** profissional → `403` (FR-010), mesmo contornando a UI.
2. Como admin/secretário, qualquer `clinic_user_id` da clínica é aceito.

## Cenário 4 — Transições de status (US5 / FR-023)

1. `PATCH /clinic/appointments/{id}/status` `scheduled→confirmed` → `200`, bloco fica verde.
2. Marcar `completed`/`no_show` **antes** de `starts_at` → `422`.
3. `cancelled → scheduled` → `422` (terminal).

## Cenário 5 — Cancelamento (FR-024)

1. `POST /clinic/appointments/{id}/cancel` → status `cancelled`, evento removido no Google do responsável.
2. Confirmar que a consulta **permanece** no histórico (sem hard delete); `DELETE` não existe.

## Cenário 6 — Conexão Google + push (P2, US4)

1. Como fisioterapeuta, no cadastro de usuário: `GET /clinic/google-calendar/connect` → autorizar no Google → callback salva tokens; `GET /clinic/google-calendar/status` → `connected: true`.
2. Criar consulta para ele → em ~1 min, evento equivalente existe no Google Calendar dele (SC-002); `google_event_id` preenchido.
3. Editar horário → evento Google atualizado. Cancelar → evento removido.
4. `DELETE /clinic/google-calendar` → `connected: false`; consultas existentes permanecem.

## Cenário 7 — Pull reverso (P2, US4 / FR-016)

1. Criar um evento direto no Google Calendar do fisioterapeuta conectado.
2. Aguardar o ciclo de polling (~5 min) ou executar o Job/Command manualmente.
3. **Esperado**: evento aparece na agenda do sistema **daquele** profissional, sem duplicar (SC-004). Evento sem paciente correspondente entra como externo (`patient_id` null, `source='google'`).

## Testes automatizados

```bash
composer run test   # PHPUnit — Feature (endpoints+policy+transições) e Unit (enum, service, jobs com Queue::fake)
npm run test        # Vitest — appointments-repository (mock apiClient), use-appointments, AppointmentModal (RHF+Zod)
npm run types && npm run lint
```

Cobertura mínima esperada: criação/validação, visibilidade por papel, rejeição de autorização (SC-003), transições inválidas, push enfileirado (`Queue::fake` + `assertPushed`), idempotência do pull.
