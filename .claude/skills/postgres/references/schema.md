# Schema

Tipo, chave e constraint certos evitam bug e economizam espaço. Mudar depois, com a tabela cheia, custa caro.

## Escolha o tipo certo (ALTO)

| Dado | Use | Evite |
| --- | --- | --- |
| Id e FK | `$table->id()` e `foreignId()` (bigint) | `integer()` / `increments()`, que estoura em 2,1 bilhões |
| Texto curto (nome, e-mail) | `string()` | Limite inventado (`string('name', 37)`) só para economizar. No Postgres não economiza nada |
| Texto longo | `text()` | `string()` para descrição, que corta em 255 |
| Dinheiro | `decimal('gross_amount', 14, 2)` (como em `clinic_financial_transactions`) ou inteiro em centavos (`bigInteger('amount_cents')`) | `float()` / `double()`, que arredonda errado |
| Sim/não | `boolean()` | `string` com `'S'`/`'N'` |
| Status finito | `string()` + Enum do PHP no cast (ver [`php-modern`](../../php-modern/SKILL.md)) | `$table->enum()`, porque mudar a lista exige migration que recria a constraint |
| Data e hora | `timestamp()` / `timestamps()`, gravando em UTC (como hoje) | Misturar `timestamp` e `timestampTz` no mesmo projeto |
| JSON | `jsonb()` | `json()` (texto puro, sem índice) e `text` com JSON dentro |

- O limite de tamanho que importa para o usuário fica na validação do FormRequest, não no tipo da coluna.
- O projeto grava tudo em UTC (`config/app.php`) com `timestamp` sem fuso. Trocar para `timestampsTz()` é decisão do projeto inteiro e vira ADR, não uma escolha por tabela.

## Chave primária (ALTO)

- **Padrão: `$table->id()`** (bigint sequencial). Pequeno, ordenado e bom para o índice.
- **Id exposto para fora** (URL pública, integração, id que não pode revelar quantos registros existem): use UUID **ordenado no tempo**. No Model, o trait `HasUuids` do Laravel já gera UUIDv7 (`Str::uuid7()`), e a migration usa `$table->uuid('id')->primary()`.
- **Evite UUID v4 aleatório como chave primária** em tabela grande: cada insert cai num ponto aleatório do índice, o que fragmenta e deixa o insert lento. O `HasVersion4Uuids` existe, mas só use se houver motivo.

## Constraints no banco, não só no PHP (ALTO)

A regra que o banco garante vale mesmo com bug no código, corrida entre requisições ou script rodado à mão.

- **Unicidade:** `$table->unique(['email', 'clinic_id'])`, como em `patients`. Sem ela, a validação `unique` do FormRequest perde para duas requisições ao mesmo tempo.
- **Unicidade por clínica:** o índice único quase sempre inclui `clinic_id`. O e-mail e o CPF do paciente se repetem entre clínicas, mas não dentro da mesma clínica.
- **NOT NULL** é o padrão. Use `nullable()` só quando "não informado" for um estado real.
- **FK** com `constrained()` e ação explícita (`cascadeOnDelete()`, `restrictOnDelete()` ou `nullOnDelete()`). Pense no que acontece com a filha quando o pai sai.
- **CHECK** (ex.: valor não negativo): o Schema builder não tem, e o SQLite não aceita `ALTER TABLE ... ADD CONSTRAINT`. Proteja pelo driver:

```php
if (DB::getDriverName() === 'pgsql') {
    DB::statement('alter table clinic_financial_transactions add constraint clinic_financial_transactions_gross_amount_non_negative check (gross_amount >= 0)');
}
```

Dê nome explícito às constraints criadas por SQL, para o `down()` conseguir apagar (`alter table clinic_financial_transactions drop constraint if exists clinic_financial_transactions_gross_amount_non_negative`).

## Nomes em minúsculas e snake_case (MÉDIO)

O Postgres converte nome sem aspas para minúsculas. Tabela ou coluna com maiúscula (`"clinicId"`) exige aspas para sempre e quebra ferramentas. A convenção do Laravel (`clinic_users`, `clinic_id`) já resolve, então não crie nome com maiúscula, nem em `DB::statement`.

## Particionamento

Só considere com centenas de milhões de linhas, dado de série temporal filtrado por data, ou quando precisar apagar dado antigo por mês inteiro. Antes disso, índice resolve. Se chegar lá, é decisão de arquitetura e vira ADR.
