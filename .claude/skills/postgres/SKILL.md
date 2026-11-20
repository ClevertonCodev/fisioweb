---
name: postgres
description: Boas práticas de Postgres para o fisioweb (Postgres 18 no Docker do fisio-app, SQLite nos testes). Use antes de escrever ou mudar migration, escolher tipo de coluna, chave primária ou índice (composto começando por clinic_id, parcial, GIN, CONCURRENTLY), ao investigar query lenta com EXPLAIN, ao lidar com lock, deadlock ou fila (SKIP LOCKED), e ao escrever paginação, upsert, insert em lote ou busca de texto.
license: MIT
metadata:
    domain: database
    triggers: postgres, pgsql, migration, índice, index, chave estrangeira, foreign key, clinic_id, tipo de coluna, jsonb, query lenta, explain, lock, deadlock, skip locked, paginação, cursorPaginate, upsert, full text, vacuum
    scope: implementation
    output-format: code
    related-skills: laravel-eloquent, laravel-queues, backend-clean-code, php-testing
    source: "adaptada de supabase-postgres-best-practices v1.1.1 (Supabase, MIT)"
---

# Postgres (fisioweb)

Origem: `supabase/agent-skills`, `supabase-postgres-best-practices` v1.1.1 (MIT), adaptada ao fisioweb. Saiu tudo que é do Supabase (RLS, pooler, roles). Os exemplos viraram migration e Eloquent. Converse com o usuário em português.

Regras de banco ordenadas por impacto, escritas para quem mexe em `modules/<Modulo>/database/migrations/`, em Repository e em Job. O ORM (scopes, casts, eager loading) está em [`laravel-eloquent`](../laravel-eloquent/SKILL.md). Esta skill cobre o que fica abaixo dele: índice, tipo, lock e plano de execução.

## Quando usar

- Criar ou alterar tabela, coluna, índice ou chave estrangeira.
- Escolher tipo de coluna ou de chave primária.
- Query lenta, timeout, tela de listagem que piora com o volume.
- Lock, deadlock, dois workers pegando o mesmo registro, job que trava outro.
- Escrever paginação, upsert, insert em lote ou busca por texto.

## Contexto do projeto

- **Dois bancos.** O ambiente Docker de cada worktree (`fisio-app`) roda **Postgres 18**, com `DB_CONNECTION=pgsql`. O `.env.example` usa SQLite, e o **PHPUnit roda em SQLite em memória**: o `phpunit.xml` força `DB_CONNECTION=sqlite`, inclusive no `fisio-app test`. As migrations rodam nos dois. Por isso:
  - SQL só do Postgres (`USING gin`, `INCLUDE`, `CONCURRENTLY`, `jsonb_path_ops`, `CHECK` via `ALTER TABLE`) vai num `DB::statement` protegido por `if (DB::getDriverName() === 'pgsql')`. Sem a proteção, a suíte quebra.
  - **O teste verde não prova nada sobre o Postgres.** Índice, plano e lock se conferem no Docker: `fisio-app psql` (`\d patients`, `EXPLAIN ...`).
- **Migration roda em transação no Postgres.** `CREATE INDEX CONCURRENTLY` não roda dentro de transação: a migration precisa de `public $withinTransaction = false;` (ver [`indices.md`](references/indices.md)).
- **Fila no banco** (`QUEUE_CONNECTION=database`): o Laravel já usa `FOR UPDATE SKIP LOCKED` na tabela `jobs` do Postgres. Não reinvente fila. Use [`laravel-queues`](../laravel-queues/SKILL.md).
- **Isolamento entre clínicas é na aplicação** (filtro por `clinic_id` no Repository e na Policy, guards `admin`, `clinic` e `patient`), não por RLS. Todo índice de tabela da clínica começa por `clinic_id`.
- `config/app.php` usa `timezone => 'UTC'`. As tabelas atuais usam `timestamps()` (sem fuso), o que funciona porque tudo é gravado em UTC.
- Migration nasce com `php artisan module:make-migration <nome> <Modulo> --no-interaction`.

## Categorias

| Prioridade | Categoria | Impacto | Referência |
| --- | --- | --- | --- |
| 1 | Índices: faltando, FK, composto, parcial, cobertura, tipo, `CONCURRENTLY` | CRÍTICO | [`references/indices.md`](references/indices.md) |
| 2 | Acesso a dados: N+1, lote, paginação por cursor, upsert | ALTO | [`references/acesso-a-dados.md`](references/acesso-a-dados.md) |
| 3 | Schema: tipos, chave primária, constraints, nomes | ALTO | [`references/schema.md`](references/schema.md) |
| 4 | Concorrência: transação curta, deadlock, `lockForUpdate`, `SKIP LOCKED`, advisory lock | MÉDIO-ALTO | [`references/concorrencia.md`](references/concorrencia.md) |
| 5 | Diagnóstico: `EXPLAIN ANALYZE`, `pg_stat_statements`, `ANALYZE`/`VACUUM` | MÉDIO | [`references/diagnostico.md`](references/diagnostico.md) |
| 6 | Recursos avançados: `jsonb` com GIN, busca de texto | BAIXO-MÉDIO | [`references/recursos-avancados.md`](references/recursos-avancados.md) |

## Regras que mais pegam

- **Toda FK ganha índice.** O Postgres não cria índice para a chave estrangeira, e `foreignId()->constrained()` também não cria. Exemplo real: `patients.clinic_id` e `patients.clinic_user_id` estão sem índice (os únicos de `patients` começam por `email` e `cpf`).
- **Índice composto: igualdade primeiro, intervalo por último.** Em tabela da clínica, `clinic_id` vem na frente.
- **`OFFSET` alto fica lento.** Para lista longa ou rolagem infinita use `cursorPaginate()`.
- **`updateOrCreate`/`firstOrCreate` sem índice único duplicam.** O índice único é o que segura a corrida. Para muitas linhas, use `upsert()`.
- **Nada de chamada HTTP dentro de `DB::transaction`** (R2, Google Calendar, WhatsApp). O lock fica preso enquanto a API externa responde.
- **Meça antes de criar índice.** Rode `EXPLAIN (ANALYZE, BUFFERS)` no Postgres do Docker, não no SQLite.

## Resultado esperado

1. **Migration** com tipos certos, FK indexada e índice para cada filtro e ordenação que a feature usa. SQL só do Postgres fica protegido pelo driver.
2. **Query** sem N+1, paginada, com lock só onde a regra exige.
3. **Verificação:**
   - `php artisan test --compact --filter=...` e `composer run test`, que conferem se a migration roda no SQLite.
   - No Docker: `fisio-app migrate` e `fisio-app psql` com `\d <tabela>` e `EXPLAIN` na query nova. Diga ao usuário o plano que viu (`Index Scan` ou `Seq Scan`) e quantas linhas havia na tabela, porque com poucas linhas o Postgres prefere `Seq Scan` mesmo com índice.
