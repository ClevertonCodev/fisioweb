# Sai a v1 de Finanças e o `?variant=`

**Tipo:** Tarefa
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 65
**Issue:** ainda não criada

## Descrição

Com as tarefas 002 a 011 prontas, a v1 de Finanças e o seletor de variantes não servem mais. A abordagem é apagar o que só a v1 e o protótipo usavam, como foi na 012.

## O que construir

- Apagar as páginas v1 de Finanças (o conteúdo antigo de `FinancesPage`, `FinancesCategoriesPage`, `FinancesTrashPage`), os componentes `components/clinic/finances/*` que só a v1 usa, a pasta do protótipo (o que não virou código real) e o ligamento ao `PrototypeSwitcher` nessas rotas.
- Hooks de `application/` e repositórios de `infrastructure/` que a v2 usa ficam; os que só a v1 usava saem.
- Atualizar `docs/prototipos-v2.md` (Finanças feita) e a memória do protótipo.
- Nenhum `?variant=` em Finanças.

## Critérios de Aceite

- [x] `grep` não acha mais `finance-prototype`, `?variant=` em Finanças nem imports de `components/clinic/finances/` (comando no SUMMARY; travado pelo `resources/js/test/finances/finance-v1-cut.test.ts`)
- [x] `npm run types`, `npm run lint`, `npm run test` e `npm run build` passam (lint sem erro em Finanças; os erros que restam no `eslint .` já existiam fora de Finanças e estão no DEFERRED; no `vitest`, a única falha é a "grade D" do `ExerciseLibraryPage`, que já existia)
- [x] As três rotas abrem a v2 (smoke)
- [x] Os testes Vitest da v1 que testavam o que saiu foram apagados ou trocados pelos da v2 (a v1 não tinha teste Vitest; entrou o teste do corte)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/012-sai-a-v1-financas/` (revisão adversária no fim da feature, como combinado)

## Depende de

- `002` a `011` (todas as tarefas do protótipo)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** ADR `docs/adr/023-listagens-programas-v2-substitui-a-v1.md` (como a v1 saiu na 008/012)
- **Skills:** `frontend-ddd`, `frontend-testing`

## Como testar na mão

1. Abrir `/clinica/financas`, `/clinica/financas/categorias` e `/clinica/financas/lixeira`: todas na v2.
2. Abrir `/clinica/financas?variant=O`: continua a v2 (nada de v1).
