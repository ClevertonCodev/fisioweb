# Contract — Google Calendar Connection API

Base: `/clinic/google-calendar` · Guard: `auth:clinic` + `clinic.guard`.

Conexão OAuth2 individual por `ClinicUser` (FR-013). Escopo: `https://www.googleapis.com/auth/calendar` com `access_type=offline` + `prompt=consent` (para obter `refresh_token`).

## GET /clinic/google-calendar/connect

Inicia o fluxo OAuth. Retorna a URL de consentimento do Google (ou redireciona).

**200**: `{ "data": { "authorization_url": "https://accounts.google.com/o/oauth2/auth?..." } }`

O `state` carrega o id do usuário autenticado (assinado) para correlação no callback.

## GET /clinic/google-calendar/callback

Callback do Google após consentimento. Troca `code` por tokens e persiste em `clinic_users` (FR-013). Define `google_connected_at`.

**Query**: `code`, `state`, `error?`.

**Sucesso**: redireciona ao frontend (cadastro de usuário) com status de conexão; ou `200 { "data": { "connected": true } }`.
**Erro/negado**: redireciona com flag de erro; nenhuma credencial é salva.

## DELETE /clinic/google-calendar

Desconecta a conta do usuário autenticado: revoga o token no Google (best-effort) e limpa as colunas `google_*` (`google_connected_at = null`). Consultas e vínculos existentes **não** são apagados (FR-edge "desconecta o Google").

**200**: `{ "data": { "connected": false } }`

## GET /clinic/google-calendar/status

Estado de conexão do usuário autenticado (para o cadastro/UI).

**200**: `{ "data": { "connected": true, "google_calendar_id": "primary", "connected_at": "2026-06-16T12:00:00Z" } }`

## Sincronização (sem endpoint — background)

- **Push** (sistema→Google): `SyncAppointmentToGoogleJob` despachado afterCommit em create/update/cancel quando o responsável tem Google conectado (FR-015/FR-024). Guarda `google_event_id`.
- **Pull** (Google→sistema): `PullGoogleCalendarJob` agendado (~5 min) por usuário conectado, usando `google_sync_token` incremental; upsert por `google_event_id`, `source='google'` para eventos externos (FR-016). Em `410 Gone`, full resync.
- **Anti-loop**: mudanças aplicadas pelo pull marcam `source`/`last_synced_at` para não re-disparar push; pushes registram `google_event_id` para o pull reconhecer como já conhecido.
