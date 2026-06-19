# Contracts — Dashboard da Clínica (REST)

Todos os endpoints sob `Route::prefix('clinic')->middleware(['auth:clinic','clinic.guard'])` (já existente). Guard `clinic` inferido pela URL `/clinic/*`. Resposta sempre no envelope `{ "data": ... }` (convenção do projeto). Campos em **snake_case** na API; o front mapeia para camelCase no `infrastructure/`.

Regra transversal de escopo (FR-001/002/003/004/005): o backend constrói um `DashboardScope` a partir do `ClinicUser` autenticado + query `scope`. `physiotherapist` é **sempre** forçado ao próprio id; `secretary` é sempre clínica inteira; só `admin` honra `scope=mine`. Qualquer `clinic_user_id`/`scope` que exceda o papel é ignorado (nunca 403 por leitura — apenas escopo reduzido), exceto no endpoint de atividades (403 para fisioterapeuta).

---

## 1. `GET /clinic/dashboard` — agregador (1ª pintura)

Carrega os widgets baratos/iniciais num round-trip (SC-003).

**Query params**:
- `scope` _(opcional)_: `clinic` (default) | `mine`. Só efetivo para `admin`.

**200 Response**:
```json
{
  "data": {
    "viewer": {
      "role": "admin",
      "can_toggle_scope": true,
      "can_choose_professional": true,
      "can_view_activities": true,
      "current_scope": "clinic"
    },
    "cards": {
      "active_patients": 128,
      "appointments_today": 8,
      "active_programs": 45,
      "available_exercises": { "count": 320, "categories_count": 15 }
    },
    "upcoming_appointments": [
      {
        "id": 12,
        "patient_name": "Maria Silva",
        "patient_photo_url": null,
        "title": "Avaliação",
        "starts_at": "2026-06-19T09:00:00-03:00",
        "status": "confirmed"
      }
    ],
    "birthdays": {
      "total": 25,
      "items": [
        {
          "patient_id": 3,
          "name": "Jadir Sotero Leite",
          "photo_url": "https://…",
          "day": 5,
          "phone": "+5511999998888",
          "can_message": true
        }
      ]
    }
  }
}
```

**Notas de campo**:
- `viewer.can_toggle_scope` = `role == admin`. `can_choose_professional` = `role in (admin, secretary)`. `can_view_activities` = idem. `available_exercises` ignora escopo (FR-009).
- `upcoming_appointments`: máx 5, `ORDER BY starts_at ASC`, status `!= cancelled`, dia de hoje no timezone da clínica (FR-010/010a).
- `birthdays.items`: ordenados por `day`; `can_message=false` quando sem telefone (FR-014). O botão abre o **WhatsApp Web** numa nova aba via `https://wa.me/<phone-digits>?text=<mensagem de parabéns pré-preenchida, URL-encoded>` — montado no front a partir de `phone` e do nome do paciente.

---

## 2. `GET /clinic/dashboard/occupancy-rate` — Taxa de ocupação

**Query params**:
- `granularity` _(obrigatório)_: `daily` | `weekly` | `monthly`.
- `clinic_user_id` _(opcional)_: profissional alvo. `admin`/`secretary` escolhem; `physiotherapist` é forçado ao próprio id. Default para admin/secretário: o usuário atual se atender, senão o primeiro profissional.

**Validação** (`OccupancyRateRequest`): `granularity ∈ {daily,weekly,monthly}`; `clinic_user_id` deve pertencer à clínica.

**200 Response**:
```json
{
  "data": {
    "clinic_user_id": 7,
    "granularity": "daily",
    "occupied_rate": 0.462,
    "buckets": [
      { "label": "1", "rate": 0.583 },
      { "label": "2", "rate": 0.5 }
    ]
  }
}
```
- `occupied_rate` = Σ duração consultas ÷ Σ janela de atendimento no range (FR-019a). `buckets`: Diária=dias do mês corrente; Semanal=últimas 12 semanas; Mensal=meses do ano corrente (FR-019b). `rate ∈ [0,1]` (front formata %).

---

## 3. `GET /clinic/dashboard/patient-acquisition` — Captação (comparação 3 anos)

**Query params**:
- `scope` _(opcional)_: `clinic` | `mine` (só admin). Fisioterapeuta sempre escopado a si.

**200 Response**:
```json
{
  "data": {
    "years": [2026, 2025, 2024],
    "sources": [
      {
        "source": "Médico",
        "per_year": { "2026": 1, "2025": 4, "2024": 2 },
        "total": 7,
        "percent_total": 41.2
      },
      {
        "source": "Não informado",
        "per_year": { "2026": 1, "2025": 0, "2024": 3 },
        "total": 4,
        "percent_total": 23.5
      }
    ],
    "totals_per_year": { "2026": 2, "2025": 4, "2024": 5 }
  }
}
```
- Base temporal = `patients.created_at` (FR-015). `years` = corrente, −1, −2 (FR-016). `source` nulo ⇒ `"Não informado"` (FR-017). `percent_total` calculado sobre o consolidado dos 3 anos.

---

## 4. `GET /clinic/dashboard/activities` — Atividades recentes (admin/secretário)

**Autorização**: `403` para `physiotherapist` (FR-023). Sempre clínica inteira, dia corrente (timezone clínica).

**200 Response**:
```json
{
  "data": {
    "items": [
      {
        "id": 90,
        "type": "program_created",
        "description": "Programa criado — Reabilitação de Joelho · Maria Silva",
        "actor_name": "Dra. Ana",
        "created_at": "2026-06-19T08:50:00-03:00"
      }
    ]
  }
}
```
- `items` ordenados por `created_at DESC`. Lista vazia ⇒ `{ "items": [] }` (front renderiza empty state, FR-024). `type` ∈ enum `ActivityType` (front escolhe ícone).

---

## Comportamentos transversais

| Caso | Resposta |
|------|----------|
| Sem dados (clínica/fisio vazio) | `200` com contagens `0` / arrays vazios (SC-006; nunca erro). |
| `physiotherapist` envia `scope=mine` ou `clinic_user_id` de outro | Ignorado; escopo forçado ao próprio (FR-005). |
| `physiotherapist` em `/activities` | `403`. |
| `granularity` inválido | `422` (validação). |
| Não autenticado / guard errado | `401` (middleware existente). |

## Contrato de navegação (Ações rápidas — frontend, FR-026)

| Ação | Destino |
|------|---------|
| Novo paciente | rota de cadastro de paciente (`/clinica/pacientes/novo` ou equivalente atual) |
| Agendar consulta | `/clinica/agenda` com sinal de abertura do modal "Nova consulta" (via `location.state` / query — AgendaPage já tem `modalOpen`) |
| Criar programa | rota de criação de programa |
| Ver exercícios | `/clinica/exercicios` |
