# Recursos avançados

`jsonb` e busca de texto. Os dois só funcionam de verdade no Postgres. No SQLite dos testes a migration roda, mas sem o índice especial, e a busca de texto do Laravel nem funciona. Confira no Docker.

## `jsonb` com índice GIN (MÉDIO)

Use `jsonb` para atributos variáveis que **não** são filtro principal (metadado de vídeo, configuração de integração, dias da semana do exercício). Campo que entra em `where`, `order by` ou relatório vira coluna própria.

Sem índice, todo filtro dentro do `jsonb` lê a tabela inteira.

**Incorreto:**

```php
$table->json('days_of_week')->nullable(); // json é texto, sem índice útil (é como está hoje em clinic_treatment_plan_exercises)

TreatmentPlanExercise::query()->whereJsonContains('days_of_week', 1)->get(); // Seq Scan
```

**Correto:**

```php
$table->jsonb('days_of_week')->nullable();
$table->index('days_of_week')->algorithm('gin'); // no SQLite vira índice comum
```

```php
TreatmentPlanExercise::query()->whereJsonContains('days_of_week', 1)->get(); // mesma query, agora usa o GIN (@>)
```

- O GIN acelera conteúdo (`@>`, gerado pelo `whereJsonContains`) e existência de chave (`?`). Ele **não** acelera `whereNotNull('metadata->proposed_at')`, como o `VideoRepository` faz em `media_videos`, que vira `->>`.
- Para uma chave consultada sempre do mesmo jeito (igualdade ou `is not null`), crie um índice de expressão, protegido pelo driver:

```php
if (DB::getDriverName() === 'pgsql') {
    DB::statement("create index media_videos_metadata_proposed_at_idx on media_videos ((metadata->>'proposed_at'))");
}
```

- Se a query só usa `@>`, o operador `jsonb_path_ops` gera um índice 2 a 3 vezes menor: `create index ... using gin (days_of_week jsonb_path_ops)`, via `DB::statement` protegido.

## Busca de texto com `tsvector` (MÉDIO)

`where('name', 'ilike', '%termo%')` não usa índice B-tree: lê a tabela toda. Para busca de texto de verdade, use o full-text do Postgres, que o Laravel expõe.

**Incorreto:**

```php
PatientEvolution::query()->where('notes', 'ilike', "%{$term}%")->get();
```

**Correto:**

```php
// migration (índice GIN sobre to_tsvector, em português)
if (DB::getDriverName() === 'pgsql') {
    Schema::table('clinic_patient_evolutions', function (Blueprint $table) {
        $table->fullText(['title', 'notes'])->language('portuguese');
    });
}
```

```php
PatientEvolution::query()
    ->where('clinic_id', $clinicId)
    ->whereFullText(['title', 'notes'], $term, ['language' => 'portuguese'])
    ->get();
```

- **O SQLite não suporta `fullText`:** sem a proteção pelo driver, a migration quebra a suíte. E o `whereFullText` também não roda no SQLite. O teste dessa busca precisa ser marcado para rodar só no Postgres (`markTestSkipped` quando o driver não for `pgsql`), ou a busca fica atrás de uma interface no Repository, com fake no teste do Service.
- O `language` do índice e o da query precisam ser iguais, ou o índice não é usado.
- `whereFullText` com `['mode' => 'websearch']` aceita a sintaxe que o usuário digita (`"frase exata"`, `-excluir`).
- Para "contém um pedaço da palavra" (autocomplete por prefixo, erro de digitação, a busca de paciente por nome, apelido ou CPF do `PatientRepository`), full-text não é a ferramenta certa: aí entram `pg_trgm` com índice GIN de trigramas, que é extensão e decisão de projeto, ou um motor de busca à parte.
