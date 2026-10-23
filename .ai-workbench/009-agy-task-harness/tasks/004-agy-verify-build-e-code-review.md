# Portão Cursor: build do frontend e code-review estruturado

**Tipo:** História
**Plano:** `../plans/agy-task-harness.md`
**Issue:** ainda não criada

## Descrição

Depois do Antigravity editar o código, o Cursor confere se o frontend compila e aplica o mesmo espírito do `/code-review`, com saída que o harness consome (crítico/alto/médio).

## O que construir

Subcomando `bin/agy-task verify` associado a um job id: executar `npm run build` na raiz; falhar com log claro se build quebrar. Command `.cursor/commands/agy-verify.md` que obriga o agente a produzir relatório alinhado a `code-review.md` **e** arquivo estruturado (ex.: `review.json` na pasta do job) com severidades `critical`, `high`, `medium`, `low`, `info`. `verify` interpreta o JSON e imprime veredito PASS/FAIL para loop (FAIL se houver critical/high/medium). Não invocar `agy` nesta fatia.

## Critérios de Aceite

- [x] `bin/agy-task verify <job-id>` roda `npm run build` e registra resultado no job
- [x] Formato de `review.json` documentado em `docs/ai-harness/agy-task.md`
- [x] `/agy-verify` em `.cursor/commands/agy-verify.md` espelha regras de `code-review.md`
- [x] `verify` retorna FAIL quando review.json contém achado critical, high ou medium
- [x] Histórias 8–9 e 19 do plano cobertas
- [x] Definição de Pronto cumprida

## Depende de

- `003-agy-task-start-e-command` (estrutura de pastas de job).

## Notas de Implementação

- **Branch:** `feat/agy-task-harness`
- **Exemplo no código:** `.cursor/commands/code-review.md`
- **Skills:** `security` (referência no command para regras clinic_id)

## Como testar na mão

Após job smoke, rodar `npm run build` via verify; gerar `review.json` manual com um `high` fictício e confirmar FAIL.
