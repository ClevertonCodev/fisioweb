# Diagnóstico

Não adivinhe por que a query está lenta: peça o plano ao Postgres. O processo de investigar está em [`systematic-debugging`](../../systematic-debugging/SKILL.md). Aqui ficam as ferramentas de banco.

## Onde rodar

- **No Postgres do Docker**, nunca no SQLite: o plano do SQLite não diz nada sobre o Postgres.
- `fisio-app psql` abre o cliente. `\d <tabela>` mostra colunas, índices e FKs.
- `fisio-app db` mostra a URL de conexão, para abrir o banco da worktree num cliente gráfico.
- Com poucas linhas, o Postgres escolhe `Seq Scan` mesmo com índice, porque é mais barato. Para avaliar índice, gere volume (factory num seeder local) e rode `analyze <tabela>` antes do `EXPLAIN`.

## `EXPLAIN ANALYZE` antes de mexer (MÉDIO)

**Incorreto:** "deve faltar um índice" e criar três índices no chute.

**Correto:** pegar o SQL e o plano.

```php
// SQL com os bindings, para colar no psql
Appointment::query()->where('clinic_id', 1)->where('status', 'scheduled')->toRawSql();

// Plano sem executar (EXPLAIN simples), direto do Laravel
Appointment::query()->where('clinic_id', 1)->where('status', 'scheduled')->explain()->dd();
```

```sql
explain (analyze, buffers)
select * from clinic_appointments where clinic_id = 1 and status = 'scheduled';
```

`EXPLAIN ANALYZE` **executa** a query. Para `update` ou `delete`, rode dentro de `begin; ... rollback;`.

| No plano | Quer dizer |
| --- | --- |
| `Seq Scan` em tabela grande | Falta índice, ou o filtro não bate com o índice que existe |
| `Rows Removed by Filter` alto | O índice usado não cobre todo o filtro: veja índice composto |
| `Sort` com `external merge` | A ordenação não usa índice e não cabe na memória |
| `Nested Loop` com `loops` alto | Join sem índice do lado de dentro, muitas vezes FK sem índice |
| `rows=` estimado muito diferente do real | Estatística velha: rode `analyze <tabela>` |

## As queries que mais custam: `pg_stat_statements` (BAIXO-MÉDIO)

É uma extensão que soma tempo e número de chamadas por query. Ela precisa estar em `shared_preload_libraries`, o que é configuração do servidor: vale em produção ou homologação, onde houver. Não está ligada no Postgres do `fisio-app`.

```sql
select calls, round(mean_exec_time::numeric, 2) as mean_ms, round(total_exec_time::numeric, 2) as total_ms, query
from pg_stat_statements
order by total_exec_time desc
limit 10;
```

Comece pela que tem o maior `total_exec_time`. Uma query de 5 ms chamada um milhão de vezes pesa mais que uma de 2 s chamada uma vez.

## Estatística e `VACUUM` (MÉDIO)

O planejador escolhe o plano pelas estatísticas da tabela. Depois de importação grande, `delete` em massa ou migration que mexe em muitos dados, a estatística fica velha e o plano piora.

```sql
analyze clinic_appointments;

select relname, last_analyze, last_autoanalyze, last_autovacuum, n_dead_tup
from pg_stat_user_tables
order by n_dead_tup desc;
```

- O autovacuum cuida disso no dia a dia. Rode `analyze` à mão depois de carga grande, inclusive num comando ou job de importação.
- Muitas linhas mortas (`n_dead_tup`) em tabela de alta rotatividade (como `jobs`) é assunto para ajustar o autovacuum no servidor, não na migration.
