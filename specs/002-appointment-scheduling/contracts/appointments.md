# Contract — Appointments API

Base: `/clinic/appointments` · Guard: `auth:clinic` + `clinic.guard` · Envelope: `{ "data": ... }` (padrão do projeto).

Todos os endpoints filtram por `clinic_id` do usuário autenticado e respeitam a `AppointmentPolicy` (FR-009/FR-010/FR-011).

## GET /clinic/appointments

Lista consultas para o calendário. Filtros por query.

**Query params**:
- `from` (ISO date) / `to` (ISO date) — janela visível do calendário.
- `clinic_user_id` (int, opcional) — filtro por fisioterapeuta (admin/secretário). Fisioterapeuta: ignorado/forçado a si.
- `status` (string, opcional) — um dos valores do enum.

**Visibilidade**: admin/secretário → todas da clínica; fisioterapeuta → só `clinic_user_id === self` (FR-009).

**200**:
```json
{ "data": [ {
  "id": 1, "patient_id": 5, "patient_name": "Carlos Mendes",
  "clinic_user_id": 2, "clinic_user_name": "Dra. Maria Silva",
  "title": "Avaliação inicial", "description": null, "location": "Sala 1",
  "starts_at": "2026-06-15T11:00:00Z", "ends_at": "2026-06-15T12:00:00Z",
  "status": "scheduled", "google_event_id": null, "source": "system"
} ] }
```

## POST /clinic/appointments

Cria consulta (status forçado `scheduled`). Dispara push ao Google (se responsável conectado) + notificação (FR-015/FR-020).

**Body** (`StoreAppointmentRequest`):
```json
{ "patient_id": 5, "clinic_user_id": 2, "title": "Avaliação inicial",
  "description": null, "location": "Sala 1",
  "starts_at": "2026-06-15T11:00:00Z", "ends_at": "2026-06-15T12:00:00Z" }
```
**Regras**: `ends_at > starts_at` (422 se inválido, FR-003); `patient_id`/`clinic_user_id` da mesma clínica (FR-012); fisioterapeuta só pode enviar o próprio `clinic_user_id` (403, FR-010).

**201**: `{ "data": { ...appointment } }` · **422** validação · **403** autorização.

## GET /clinic/appointments/{id}

**200** `{ "data": {...} }` · **404** se de outra clínica.

## PUT /clinic/appointments/{id}

Edita dados (horário, título, observações, local) e/ou `clinic_user_id` (admin/secretário). Dispara push update ao Google. Transição de status **não** acontece aqui (ver endpoint dedicado).

**Body** (`UpdateAppointmentRequest`): campos opcionais; mesmas regras de POST.

**200** `{ "data": {...} }` · **403/404/422**.

## PATCH /clinic/appointments/{id}/status

Altera o status respeitando a máquina de transições (FR-023).

**Body** (`UpdateAppointmentStatusRequest`): `{ "status": "confirmed" }`

**200** `{ "data": {...} }` · **422** transição inválida (ex.: `completed` antes de `starts_at`, ou reativar `cancelled`).

## POST /clinic/appointments/{id}/cancel

Cancela (status → `cancelled`) e remove o evento no Google do responsável (FR-024). Sem hard delete.

**200** `{ "data": {...} }` · **403/404**.

> `DELETE /clinic/appointments/{id}` **não** é exposto (sem exclusão definitiva).

## Selects auxiliares (já existentes / reutilizar)

- `GET /clinic/users/professionals` → lista de fisioterapeutas (já existe). Para fisioterapeuta autenticado, retorna só ele (ajuste por papel).
- `GET /clinic/patients` → pacientes da clínica (já existe; usado no select de paciente).
