# Acesso a dados

Como ler e escrever sem multiplicar idas ao banco nem abrir corrida entre requisições. O eager loading em detalhe está em [`laravel-eloquent`](../../laravel-eloquent/SKILL.md).

## Elimine o N+1 (ALTO)

Uma query por item dentro de um laço transforma 1 ida ao banco em 101. Carregue tudo de uma vez.

**Incorreto:**

```php
$patients = Patient::query()->where('clinic_id', $clinicId)->get();

foreach ($patients as $patient) {
    $patient->clinicUser->name; // uma query por paciente
}
```

**Correto:**

```php
$patients = Patient::query()->with('clinicUser:id,name')->where('clinic_id', $clinicId)->get();
```

Para lista de ids, use `whereIn('id', $ids)` em vez de um `find` por id. Em desenvolvimento, `Model::preventLazyLoading(! app()->isProduction())` no `AppServiceProvider` faz o N+1 virar exceção.

## Insira em lote (MÉDIO)

Cada `create()` é uma ida ao banco, e ainda dispara os eventos do Model. Para importação ou carga grande, monte as linhas e insira em blocos.

**Incorreto:**

```php
foreach ($rows as $row) {
    FinancialTransaction::create($row); // 10.000 idas ao banco
}
```

**Correto:**

```php
collect($rows)
    ->map(fn (array $row): array => [...$row, 'created_at' => now(), 'updated_at' => now()])
    ->chunk(500)
    ->each(fn ($chunk) => FinancialTransaction::insert($chunk->all()));
```

- `insert()` não dispara evento de Model, não aplica cast nem preenche `timestamps`. Preencha as datas à mão, como no exemplo, e grave o valor do Enum (`->value`), não o objeto.
- Blocos de ~500 linhas. O Postgres aceita até 65.535 parâmetros por query, então um bloco grande demais com muitas colunas estoura esse limite.
- Para ler muito dado, use `chunkById()` ou `lazyById()`, nunca `get()` na tabela inteira.

## Paginação por cursor em lista longa (MÉDIO-ALTO)

O `OFFSET` lê e descarta todas as linhas puladas: a página 1 é rápida e a página 500 lê 10.000 linhas para devolver 20. A paginação por cursor (`where id > ?`) usa o índice e custa o mesmo em qualquer página.

**Incorreto (rolagem infinita ou exportação com `paginate`):**

```php
Patient::query()->where('clinic_id', $clinicId)->orderBy('id')->paginate(20);
```

**Correto:**

```php
Patient::query()->where('clinic_id', $clinicId)->orderBy('id')->cursorPaginate(20);
```

- O `cursorPaginate()` exige `orderBy` em coluna única (ou que forme chave única com o `id` no fim: `orderBy('created_at')->orderBy('id')`), e precisa de índice que cubra o filtro e a ordenação (`['clinic_id', 'id']`). Hoje `patients` não tem nenhum índice que comece por `clinic_id` (ver [`indices.md`](indices.md)).
- Ele não dá o total nem salto para a página N. Tela que mostra "página 3 de 40" continua com `paginate()`, que funciona bem enquanto as páginas forem poucas.

## Upsert e "busca e depois insere" (MÉDIO)

`firstOrCreate` e `updateOrCreate` fazem `select` e, se não acham nada, `insert`. Sem índice único, duas requisições ao mesmo tempo não acham nada, as duas inserem, e o registro duplica. Com índice único, o Laravel 12 cai no `createOrFirst()`: o segundo `insert` bate no índice e ele busca o registro que entrou primeiro. Quem garante a regra é o índice único, não o método.

**Incorreto (sem índice único, duplica o saldo do mês):**

```php
Schema::create('clinic_financial_opening_balances', function (Blueprint $table) {
    $table->id();
    $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
    $table->unsignedSmallInteger('year');
    $table->unsignedTinyInteger('month');
    $table->decimal('amount', 14, 2)->default(0);
    $table->timestamps();
});
```

**Correto (como a migration real faz, e aí o `updateOrCreate` do `PeriodOpeningBalanceRepository` é seguro):**

```php
$table->unique(['clinic_id', 'year', 'month']);
```

```php
PeriodOpeningBalance::updateOrCreate(
    ['clinic_id' => $clinicId, 'year' => $year, 'month' => $month],
    ['amount' => $amount, 'updated_by_user_id' => $userId],
);
```

Para gravar muitas linhas, ou quando não precisa do Model, o `upsert()` faz tudo numa instrução só:

```php
PeriodOpeningBalance::upsert(
    [['clinic_id' => $clinicId, 'year' => $year, 'month' => $month, 'amount' => $amount]],
    uniqueBy: ['clinic_id', 'year', 'month'],
    update: ['amount', 'updated_at'],
);
```

- `upsert()` gera `insert ... on conflict (...) do update` e não dispara evento de Model.
- Quando você precisa do Model e de evento, use `createOrFirst()`: ele tenta o `insert` e, se bater no índice único, busca o registro existente.
- "Inserir só se não existir": `insertOrIgnore()`.
- Sem índice único, nenhum desses é seguro. O índice único é o que garante a regra.
