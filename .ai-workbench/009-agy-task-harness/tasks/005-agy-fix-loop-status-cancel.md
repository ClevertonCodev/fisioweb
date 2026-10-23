# Loop de correção (3x), status, result e cancel

**Tipo:** História
**Plano:** `../plans/agy-task-harness.md`
**Issue:** ainda não criada

## Descrição

Quando o verify falha por achados médios ou piores, o harness reenvia correção ao Antigravity até três vezes, com comandos para acompanhar e cancelar jobs.

## O que construir

Subcomando `bin/agy-task fix-loop` (ou integrado a `verify --auto-fix`): ler `review.json`, montar prompt só com achados critical/high/medium, chamar `agy` novamente com mesmo modelo do job, incrementar contador em `meta.json`, parar após 3 tentativas com mensagem para o humano. Subcomandos `status`, `result`, `cancel` para jobs locais (pid, tail do log, último review). Teste com mock de `agy` opcional para contar invocações sem gastar quota.

## Critérios de Aceite

- [x] Após FAIL no verify, `fix-loop` dispara novo `agy` com contexto dos achados
- [x] Não mais que 3 ciclos fix automáticos por job
- [x] `status` e `result` funcionam para job em background e concluído
- [x] `cancel` encerra processo sem corromper `meta.json`
- [x] Histórias 10–11 e 7 do plano cobertas
- [x] Definição de Pronto cumprida

## Depende de

- `004-agy-verify-build-e-code-review` (review.json e verify).

## Notas de Implementação

- **Branch:** `feat/agy-task-harness`
- **Exemplo no código:** fluxo descrito em codex-plugin status/result/cancel
- **Skills:** `agy-harness` (comportamento do loop)

## Como testar na mão

Simular review com `high`, rodar fix-loop com `agy` fake no PATH; confirmar parada na 4ª tentativa.
