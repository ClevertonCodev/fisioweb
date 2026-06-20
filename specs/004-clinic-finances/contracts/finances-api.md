# REST Contract: Clinic Finances API

**Feature**: 004-clinic-finances
**Date**: 2026-06-20
**Base path**: `/clinic/finances`
**Auth**: `auth:clinic` (JWT) + middleware `clinic.guard` + middleware `clinic.admin` (admin-only)

Convenções gerais (idênticas ao restante do módulo Clinic):
- Respostas envelopadas em `{ "data": ... }`. Listas usam `{ "data": [...], "meta": { "page", "perPage", "total" } }`.
- Erros usam padrão Laravel: 401 (não autenticado), 403 (não admin / clínica errada), 404, 422 (validação), 500.
- Datas no payload em ISO 8601 (`YYYY-MM-DD` para `date`, `YYYY-MM-DDTHH:mm:ssZ` para timestamps).
- Monetários como `decimal` serializado em string ("150.00") **ou** number — manter o padrão do projeto (a confirmar no commit; aqui usamos number BRL com 2 casas).
- Snake_case na resposta JSON; o frontend converte para camelCase no mapper do `infrastructure/`.

---

## Transações

### `GET /clinic/finances/transactions`

Lista paginada (não inclui soft-deleted).

**Query params**:

| Param | Tipo | Default | Observação |
|---|---|---|---|
| `period` | string `YYYY-MM` | mês corrente (TZ da clínica) | filtro principal por mês |
| `type` | enum `entrada\|saida` | — | opcional |
| `status` | enum `recebido\|pendente\|pago` | — | opcional, validado contra `type` quando ambos vierem |
| `category_id` | int | — | opcional |
| `payment_method` | enum `PaymentMethod` | — | opcional |
| `q` | string | — | busca em `description`, `category.name`, `type` |
| `sort` | string | `-date` | colunas válidas: `date`, `description`, `category`, `type`, `gross_amount`, `status`. `-` = desc |
| `page` | int | 1 | |
| `per_page` | int | 25 | valores aceitos: 10, 25, 50 |

**200 Response**:

```json
{
  "data": [
    {
      "id": 123,
      "date": "2026-06-20",
      "description": "Atendimento - João Silva",
      "category": { "id": 4, "name": "Atendimento", "type": "entrada", "origin": "system" },
      "type": "entrada",
      "status": "recebido",
      "payment_method": "pix",
      "gross_amount": 150.00,
      "fee_amount": 0.00,
      "net_amount": 150.00,
      "notes": null,
      "created_at": "2026-06-20T17:32:11Z",
      "updated_at": "2026-06-20T17:32:11Z"
    }
  ],
  "meta": { "page": 1, "perPage": 25, "total": 1 }
}
```

### `POST /clinic/finances/transactions`

**Body**:

```json
{
  "date": "2026-06-20",
  "description": "Atendimento - João Silva",
  "category_id": 4,
  "type": "entrada",
  "status": "recebido",
  "payment_method": "pix",
  "gross_amount": 150.00,
  "fee_amount": 0.00,
  "notes": null
}
```

**Validações**: vide `StoreFinancialTransactionRequest` (data-model.md / regras de domínio).

**201 Response**: `{ "data": { ...transação criada... } }`

### `GET /clinic/finances/transactions/{id}`

**200**: `{ "data": { ... } }` (404 se não pertence à clínica ou está soft-deleted).

### `PUT /clinic/finances/transactions/{id}`

Mesmos campos de `POST`. **200**: `{ "data": { ... atualizado ... } }`.

### `DELETE /clinic/finances/transactions/{id}`

Soft delete permanente. **204** sem body. Preenche `deleted_by_user_id` e `deleted_at`.

### `GET /clinic/finances/transactions/trash`

Lista soft-deleted, mesmas paginação/ordenação. Inclui `deleted_at` e `deleted_by`.

```json
{
  "data": [
    {
      "id": 99, "date": "2026-05-10", "description": "...",
      "type": "saida", "status": "pago", "gross_amount": 200.00,
      "deleted_at": "2026-06-18T10:11:00Z",
      "deleted_by": { "id": 5, "name": "Cleverton" }
    }
  ],
  "meta": { "page": 1, "perPage": 25, "total": 1 }
}
```

### `POST /clinic/finances/transactions/{id}/restore`

Restaura uma transação da lixeira. **200**: `{ "data": { ... restaurada ... } }`.

> **Não há** rota de "force delete" / purga (FR-007c).

---

## Resumo do mês (cards)

### `GET /clinic/finances/summary`

**Query**:

| Param | Tipo | Default |
|---|---|---|
| `period` | `YYYY-MM` | mês corrente |
| filtros opcionais `type`, `status`, `category_id`, `payment_method`, `q` | — | refletem cards filtrados (FR-019) |

**200**:

```json
{
  "data": {
    "period": { "year": 2026, "month": 6 },
    "income":  { "received": 1500.00, "pending": 300.00 },
    "expense": { "paid": 800.00, "pending": 120.00 },
    "opening_balance": 0.00,
    "available": 700.00,
    "forecast": 880.00
  }
}
```

---

## Saldo inicial do período

### `PUT /clinic/finances/opening-balance`

**Body**:

```json
{ "year": 2026, "month": 6, "amount": 1200.50 }
```

**200**: `{ "data": { "year": 2026, "month": 6, "amount": 1200.50, "updated_at": "..." } }`

Cria o registro se inexistente (upsert por `(clinic_id, year, month)`).

---

## Categorias

### `GET /clinic/finances/categories`

**Query**: `type=entrada|saida` (opcional), `include_inactive=true|false` (default `false`).

**200**:

```json
{
  "data": [
    { "id": 1,  "name": "Atendimento", "type": "entrada", "origin": "system", "active": true, "display_order": 0 },
    { "id": 42, "name": "Pilates",     "type": "entrada", "origin": "custom", "active": true, "display_order": 100 }
  ]
}
```

Resultado já reflete a visibilidade efetiva da clínica (seed - overrides ∪ custom ativas).

### `POST /clinic/finances/categories`

**Body**: `{ "name": "Pilates", "type": "entrada" }`. Cria `origin=custom`, `clinic_id` da auth.

### `POST /clinic/finances/categories/{id}/toggle-active`

- Se `origin=system`: cria/atualiza `clinic_financial_category_overrides` invertendo o estado atual percebido.
- Se `origin=custom`: alterna `active` na própria linha (e exige ser da própria clínica).

**200**: `{ "data": { "id": 1, "active": false } }`

### `DELETE /clinic/finances/categories/{id}`

Apenas para `origin=custom` da clínica. Hard-delete só se não houver transações vinculadas; caso contrário, retorna 409 com mensagem amigável e a UI sugere "Desativar" via toggle.

---

## Relatório

### `GET /clinic/finances/reports/summary`

Mesma shape do `summary` + variação:

```json
{
  "data": {
    "period": { "year": 2026, "month": 6 },
    "totals":   { "income": 1800.00, "expense": 920.00, "balance": 880.00 },
    "variation":{ "income": 0.15, "expense": -0.10, "balance": 0.42 }   // null quando previous = 0
  }
}
```

### `GET /clinic/finances/reports/income-vs-expense`

**Query**: `from=YYYY-MM-DD&to=YYYY-MM-DD&granularity=day|week|month` (default `day`).

```json
{
  "data": [
    { "date": "2026-06-01", "income": 150.00, "expense": 0.00 },
    { "date": "2026-06-02", "income": 300.00, "expense": 50.00 }
  ]
}
```

### `GET /clinic/finances/reports/category-distribution`

**Query**: `period=YYYY-MM` (ou `from/to`) + `type=entrada|saida` (opcional) + `limit=5`.

```json
{
  "data": [
    { "category_id": 4, "name": "Atendimento", "type": "entrada", "total": 1200.00, "percentage": 66.7 }
  ]
}
```

### `GET /clinic/finances/reports/monthly-comparison`

**Query**: `months=12` (default 12).

```json
{
  "data": [
    { "year": 2025, "month": 7, "income": 0, "expense": 0 },
    ...,
    { "year": 2026, "month": 6, "income": 1800.00, "expense": 920.00 }
  ]
}
```

### `GET /clinic/finances/reports/category-breakdown`

**Query**: `period=YYYY-MM` (ou `from/to`), `type=entrada|saida` (opcional), `sort=`.

```json
{
  "data": [
    { "category_id": 4, "name": "Atendimento", "type": "entrada", "count": 8, "total": 1200.00, "percentage": 66.7 }
  ]
}
```

---

## Exportação

### `GET /clinic/finances/export`

**Query**:

| Param | Tipo | Default |
|---|---|---|
| `format` | `csv\|xlsx\|pdf` | obrigatório |
| `range` | `current_month\|previous_month\|custom` | obrigatório |
| `from` | `YYYY-MM-DD` | obrigatório quando `range=custom` |
| `to` | `YYYY-MM-DD` | obrigatório quando `range=custom` |

**200**: stream do arquivo com `Content-Disposition: attachment; filename="financas-YYYY-MM-DD.{ext}"`.

- CSV: `text/csv; charset=UTF-8`, colunas Data; Descrição; Categoria; Tipo; Método; Valor bruto; Taxa; Valor líquido; Status.
- XLSX: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, mesmas colunas.
- PDF: `application/pdf`, layout tabular com cabeçalho da clínica e total.

**422** quando não há transações no intervalo (FR-026), com mensagem `intervalo sem transações para exportar`.

---

## Códigos de erro relevantes

| Cenário | Status | Body |
|---|---|---|
| Não autenticado | 401 | padrão Laravel |
| Autenticado mas não admin | 403 | `{ "message": "Acesso restrito ao administrador da clínica." }` |
| Recurso de outra clínica | 403/404 | 404 quando a Policy entender por ocultação |
| Validação falhou | 422 | `{ "message": "...", "errors": { "campo": ["msg"] } }` |
| Categoria com transações vinculadas (delete) | 409 | `{ "message": "Categoria possui transações; desative-a em vez de excluir." }` |
| Exportação sem dados | 422 | conforme acima |
