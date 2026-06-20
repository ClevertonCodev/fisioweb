# Data Model: Clinic Finances

**Feature**: 004-clinic-finances
**Date**: 2026-06-20

Todas as tabelas têm prefixo `clinic_` (convenção do módulo e memória de case-sensitivity). Multi-tenant: toda linha pertence a `clinic_id` (exceto categorias `system`, com `clinic_id = NULL`).

## Enums (PHP — `modules/Clinic/app/Enums/`)

| Enum | Valores | Uso |
|---|---|---|
| `FinancialTransactionType` | `entrada`, `saida` | tipo da transação e da categoria |
| `FinancialTransactionStatus` | `recebido`, `pendente`, `pago` | status; `recebido`/`pendente` para entrada, `pago`/`pendente` para saída |
| `PaymentMethod` | `dinheiro`, `pix`, `cartao_debito`, `cartao_credito`, `transferencia`, `boleto`, `outro` | método informado por transação |
| `FinancialCategoryOrigin` | `system`, `custom` | origem da categoria (seed global vs criada pela clínica) |

## Tabela: `clinic_financial_categories`

Catálogo combinado de seed global + categorias customizadas por clínica.

| Coluna | Tipo | Restrições | Observação |
|---|---|---|---|
| `id` | bigint PK | auto | |
| `clinic_id` | bigint FK | nullable, on delete cascade | `NULL` ⇒ categoria seed/global; preenchido ⇒ custom daquela clínica |
| `name` | varchar(120) | not null | |
| `type` | enum | not null | `FinancialTransactionType` |
| `origin` | enum | not null, default `system` | `FinancialCategoryOrigin` |
| `active` | boolean | not null, default `true` | só usado para custom; categorias `system` controlam ativação por `clinic_financial_category_overrides` |
| `display_order` | int | not null, default 0 | ordenação na UI |
| `created_at` / `updated_at` | timestamps | | |

**Índices**:
- `(clinic_id, type, active)`
- `(origin, type)`
- Unique `(clinic_id, name, type)` para evitar duplicata por clínica.

**Regras**:
- `origin = system` ⇒ `clinic_id IS NULL` (DB CHECK ou validação no Service).
- `origin = custom` ⇒ `clinic_id NOT NULL`.
- Categorias `system` não podem ser excluídas/editadas por clínica; só "desativadas" via override.

## Tabela: `clinic_financial_category_overrides`

Registra desativação local de categorias seed por uma clínica.

| Coluna | Tipo | Restrições | Observação |
|---|---|---|---|
| `id` | bigint PK | auto | |
| `clinic_id` | bigint FK | not null, on delete cascade | |
| `financial_category_id` | bigint FK | not null, on delete cascade | aponta para `clinic_financial_categories.id` com `origin=system` |
| `active` | boolean | not null, default `false` | sempre `false` na prática (presença = desativado) |
| `created_at` / `updated_at` | timestamps | | |

**Índices**: Unique `(clinic_id, financial_category_id)`.

**Visibilidade efetiva** para uma clínica `C`:

```sql
SELECT c.*
FROM clinic_financial_categories c
LEFT JOIN clinic_financial_category_overrides o
  ON o.financial_category_id = c.id AND o.clinic_id = :C
WHERE
  (c.origin = 'system' AND c.active = true AND (o.id IS NULL OR o.active = true))
  OR
  (c.origin = 'custom' AND c.clinic_id = :C AND c.active = true)
ORDER BY c.type, c.display_order, c.name
```

## Tabela: `clinic_financial_opening_balances`

Saldo inicial reconciliado por (clínica, ano, mês). Editado manualmente pelo admin (FR-021).

| Coluna | Tipo | Restrições |
|---|---|---|
| `id` | bigint PK | auto |
| `clinic_id` | bigint FK | not null, on delete cascade |
| `year` | smallint | not null |
| `month` | tinyint | not null (1–12) |
| `amount` | decimal(14, 2) | not null, default 0.00 |
| `updated_by_user_id` | bigint FK nullable | rastreio de quem alterou |
| `created_at` / `updated_at` | timestamps | |

**Índices**: Unique `(clinic_id, year, month)`.

## Tabela: `clinic_financial_transactions`

| Coluna | Tipo | Restrições | Observação |
|---|---|---|---|
| `id` | bigint PK | auto | |
| `clinic_id` | bigint FK | not null, on delete cascade | |
| `financial_category_id` | bigint FK | not null, on delete restrict | preserva histórico |
| `type` | enum | not null | `FinancialTransactionType` (replicado para query rápida sem join) |
| `status` | enum | not null | `FinancialTransactionStatus` |
| `payment_method` | enum | not null | `PaymentMethod` |
| `date` | date | not null | data da transação (na timezone da clínica) |
| `description` | varchar(255) | not null | |
| `gross_amount` | decimal(14, 2) | not null, > 0 | valor bruto |
| `fee_amount` | decimal(14, 2) | not null, default 0.00, ≥ 0 | taxa opcional preenchida manualmente |
| `net_amount` | decimal(14, 2) GENERATED | `gross_amount - fee_amount` (stored se DB suportar; senão computar no Service) | |
| `notes` | text | nullable | observações livres exibidas na linha expansível |
| `created_by_user_id` | bigint FK | not null | quem registrou |
| `deleted_by_user_id` | bigint FK | nullable | quem soft-deletou |
| `created_at` / `updated_at` | timestamps | | |
| `deleted_at` | timestamp | nullable | soft delete permanente (sem purga) |

**Índices**:
- `(clinic_id, date)`
- `(clinic_id, type, status)`
- `(clinic_id, financial_category_id)`
- `(clinic_id, deleted_at)` (para queries da lixeira e exclusão do listado padrão)
- `(clinic_id, payment_method)`

**Regras de domínio (validadas em FormRequest + Service)**:
- `gross_amount > 0`.
- `fee_amount ≥ 0` e `fee_amount ≤ gross_amount`.
- `status` ∈ {`recebido`, `pendente`} quando `type = entrada`; `status` ∈ {`pago`, `pendente`} quando `type = saida`.
- `financial_category_id` deve estar visível para a clínica (ver query R7) e ter o mesmo `type` da transação.
- `date` não pode ser superior a 1 ano no futuro (sanidade).
- Edição altera `updated_at` (sem audit log dedicado nesta versão; coberto por log padrão da app).

**Transições de estado**:

```
pendente ─► recebido (entrada)
pendente ─► pago     (saida)
recebido ◄─► pendente (admin pode reverter)
pago     ◄─► pendente
qualquer ─► (soft delete) ─► restaurável a partir da lixeira
```

## Entidades derivadas (não persistidas)

### `MonthlySummary`

Construído em runtime pelo `FinanceSummaryService`:

```
{
  period: { year, month },
  income:      { received: decimal, pending: decimal },
  expense:     { paid: decimal,     pending: decimal },
  openingBalance: decimal,
  available:   decimal,   // opening + income.received - expense.paid
  forecast:    decimal,   // available + income.pending - expense.pending
}
```

### `Report*`

- `IncomeVsExpenseSeries`: lista de `{ date, income, expense }` por dia/semana/mês do período.
- `CategoryDistribution`: lista de `{ categoryId, categoryName, type, total, percentage }` — top 5 por valor.
- `MonthlyComparison`: lista de 12 meses `{ year, month, income, expense }`.
- `CategoryBreakdownRow`: linha da tabela resumo `{ category, type, count, total, percentage }`.

### `VariationIndicator` (cards do relatório)

```
variation = (current - previous) / previous   // se previous != 0
variation = null                              // exibir "—" no card
```

## Relações (visão geral)

```
clinics ──< clinic_financial_transactions >── clinic_financial_categories
   │                                                       │
   │                                                       └──< clinic_financial_category_overrides (apenas para origin=system)
   │
   └──< clinic_financial_opening_balances

clinic_users >── clinic_financial_transactions  (created_by, deleted_by)
clinic_users >── clinic_financial_opening_balances (updated_by)
```

## Seed (FinancialCategorySeeder)

Categorias `system` semeadas em ordem (display_order incremental):

**Entradas**: Atendimento, Atendimento em casa, Aula, Aula experimental, Avaliação, Consultoria, Outras entradas, Outro.

**Saídas**: Água e esgoto, Ajuste de balanço, Alimentação, Aluguel, Assinaturas, Combustível, Contabilidade, Energia elétrica, Equipamentos, Impostos, Internet, Marketing, Material de escritório, Plano de saúde, Salários, Serviços terceirizados, Telefone, Transporte, Outras saídas.

Inseridas apenas se a tabela estiver vazia (`firstOrCreate` por `(origin=system, name, type)`).
