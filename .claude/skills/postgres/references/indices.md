# Índices

Índice certo é o maior ganho de performance que existe no banco. Antes de criar, rode `EXPLAIN` na query (ver [`diagnostico.md`](diagnostico.md)). Depois de criar, rode de novo e confira que o plano mudou.

## Indexe as colunas de `WHERE`, `JOIN` e `ORDER BY` (CRÍTICO)

Filtrar por uma coluna sem índice faz `Seq Scan`: o Postgres lê a tabela inteira, e o custo cresce com o número de linhas.

**Incorreto:**

```php
Schema::create('clinic_appointments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
    $table->string('status', 20)->default('scheduled');
    $table->timestamp('starts_at');
    $table->timestamps();
});

// Repository: lista os atendimentos agendados da clínica -> Seq Scan em clinic_appointments
Appointment::query()->where('clinic_id', $clinicId)->where('status', 'scheduled')->get();
```

**Correto (como a migration real de `clinic_appointments` faz):**

```php
Schema::create('clinic_appointments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
    $table->string('status', 20)->default('scheduled');
    $table->timestamp('starts_at');
    $table->timestamps();

    $table->index(['clinic_id', 'status']);
});
```

## Toda chave estrangeira ganha índice (ALTO)

O Postgres **não** cria índice para a coluna da FK, e o `foreignId()->constrained()` do Laravel também não cria. O MySQL cria, e por isso o costume engana. Sem índice, o `JOIN` e o `whereHas` ficam lentos, e o `ON DELETE CASCADE` varre a tabela filha inteira a cada exclusão do pai.

**Incorreto (é como está hoje em `modules/Patient/database/migrations/2026_02_27_000003_create_patients_table.php`):**

```php
$table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
$table->foreignId('clinic_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
// ...
$table->unique(['email', 'clinic_id']);
$table->unique(['cpf', 'clinic_id']);
```

Os dois índices únicos começam por `email` e `cpf`, então não servem para `where clinic_id = ?`, que é a consulta de toda listagem de pacientes.

**Correto:**

```php
$table->foreignId('clinic_id')->constrained('clinics')->cascadeOnDelete();
$table->foreignId('clinic_user_id')->nullable()->constrained('clinic_users')->nullOnDelete();
$table->index('clinic_id');
$table->index('clinic_user_id');
```

Em tabela que já existe, como `patients`, o índice vai numa migration nova com `Schema::table`, não na migration de criação.

Se a tabela já tem um índice composto que **começa** pela FK (`['clinic_id', 'status']` em `clinic_appointments`), ele serve para a FK e não precisa de outro.

Para achar FK sem índice no Postgres do Docker (`fisio-app psql`):

```sql
select conrelid::regclass as table_name, a.attname as fk_column
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
where c.contype = 'f'
  and not exists (
    select 1 from pg_index i
    where i.indrelid = c.conrelid and a.attnum = i.indkey[0]
  );
```

## Índice composto: igualdade primeiro, intervalo por último (ALTO)

Um índice em `(a, b)` serve para `where a = ?` e para `where a = ? and b > ?`, mas **não** para `where b > ?` sozinho (regra do prefixo à esquerda). Dois índices separados obrigam o Postgres a combinar os dois, o que é mais lento.

Em tabela da clínica, a consulta sempre filtra por `clinic_id`, e por isso ele vem na frente.

**Incorreto:**

```php
$table->index('status');
$table->index('starts_at');

// where clinic_id = ? and status = 'scheduled' and starts_at > ? order by starts_at
```

**Correto:**

```php
$table->index(['clinic_id', 'status', 'starts_at']);
```

A ordem das colunas segue a query: as que usam `=` primeiro, a de intervalo ou de `order by` por último.

## Índice parcial para filtro fixo (ALTO)

Se a query **sempre** filtra pela mesma condição (`deleted_at is null`, `status = 'scheduled'`), o índice parcial guarda só essas linhas: fica menor e mais rápido, e pesa menos na escrita. O Schema builder não tem índice parcial, então use `DB::statement`. O SQLite também aceita `CREATE INDEX ... WHERE`, mas confira o plano no Postgres.

```php
public function up(): void
{
    DB::statement('create index clinic_appointments_clinic_scheduled_idx on clinic_appointments (clinic_id, starts_at) where status = \'scheduled\'');
}

public function down(): void
{
    DB::statement('drop index if exists clinic_appointments_clinic_scheduled_idx');
}
```

Para um índice parcial servir, a query precisa ter **a mesma condição** do índice (`where status = 'scheduled'`).

## Índice de cobertura com `INCLUDE` (MÉDIO-ALTO)

Quando a query filtra por uma coluna e só lê mais duas ou três, o `INCLUDE` coloca essas colunas no índice, e o Postgres responde só pelo índice (`Index Only Scan`), sem ler a tabela. Só existe no Postgres, então proteja pelo driver:

```php
if (DB::getDriverName() === 'pgsql') {
    DB::statement('create index clinic_appointments_clinic_status_cover_idx on clinic_appointments (clinic_id, status) include (starts_at, title)');
}
```

Use só em query quente e medida. Cada coluna incluída aumenta o índice.

## Escolha o tipo de índice (ALTO)

| Tipo | Serve para | No Laravel |
| --- | --- | --- |
| B-tree (padrão) | `=`, `<`, `>`, `between`, `in`, `is null`, `order by` | `$table->index(...)` |
| GIN | `jsonb` (`@>`, `?`), arrays, busca de texto | `$table->index('metadata')->algorithm('gin')` ou `$table->fullText(...)` |
| BRIN | Tabela enorme, só de inserção, filtrada por data (log, evento) | `$table->index('created_at')->algorithm('brin')` |
| GiST | Geometria, intervalos, vizinho mais próximo | `$table->spatialIndex(...)` |

No SQLite, `algorithm()` é ignorado e vira um índice comum: a migration roda, mas só o Postgres usa o tipo certo. Índice B-tree em `jsonb` não acelera `@>`, então para isso o índice precisa ser GIN (ver [`recursos-avancados.md`](recursos-avancados.md)).

## Índice em tabela grande: `CONCURRENTLY` fora de transação (CRÍTICO em produção)

`CREATE INDEX` comum bloqueia a escrita na tabela até terminar, o que em tabela grande significa minutos sem `insert` nem `update`. O `CONCURRENTLY` não bloqueia, mas **não roda dentro de transação**, e no Postgres o Laravel roda cada migration dentro de uma. Desligue a transação na migration:

**Incorreto (dá erro "CREATE INDEX CONCURRENTLY cannot run inside a transaction block"):**

```php
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_appointments', function (Blueprint $table) {
            $table->index(['clinic_id', 'created_at'])->online();
        });
    }
};
```

**Correto:**

```php
return new class extends Migration
{
    public $withinTransaction = false;

    public function up(): void
    {
        Schema::table('clinic_appointments', function (Blueprint $table) {
            $table->index(['clinic_id', 'created_at'])->online();
        });
    }

    public function down(): void
    {
        Schema::table('clinic_appointments', function (Blueprint $table) {
            $table->dropIndex(['clinic_id', 'created_at']);
        });
    }
};
```

- `->online()` gera `create index concurrently` no Postgres e é ignorado no SQLite.
- Uma migration sem transação deve ter **uma operação só**. Se ela falhar no meio, nada é desfeito.
- Se o `CONCURRENTLY` falhar, ele deixa um índice `INVALID`. Confira com `\d clinic_appointments` no `fisio-app psql` e apague com `drop index concurrently`.
- Em tabela nova ou pequena não precisa: use `$table->index(...)` comum.
