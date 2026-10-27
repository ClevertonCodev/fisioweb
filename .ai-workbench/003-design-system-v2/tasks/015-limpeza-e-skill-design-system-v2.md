# Limpeza da pasta Vue e skill do design system v2

**Tipo:** Tarefa
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

Com os 35 componentes portados, a pasta Vue deixa de ser necessária. Esta tarefa apaga a pasta, documenta o DS para quem for montar as telas v2 e faz a conferência final de que nada da v1 mudou antes da PR única.

## O que construir

- Conferir que todos os 35 componentes Vue têm equivalente React exportado por `@/components/ds` e seção no catálogo, e que os 18 arquivos de teste do Vue foram portados (194 casos `it`).
- Apagar `resources/design-system/` e remover a entrada dela no `.gitignore` e as exclusões no Vitest e no ESLint, que perdem o sentido.
- Criar a skill `design-system` em `.claude/skills/` com: quando usar (tela v2 usa o DS; tela v1 usa shadcn), tokens e utilitários `ds`, catálogo dos componentes com as props principais, uso com RHF + Zod, dark mode e `DsThemeToggle`, e onde está o catálogo de dev. Incluir a skill no Skill Map do `CLAUDE.md`.
- Conferência final do diff contra a `main`.

## Critérios de Aceite

- [x] A lista dos 35 componentes Vue contra os exports React está na evidência, sem nenhum faltando.
- [x] `resources/design-system/` não existe mais, e nem `vue`, `maska` ou `@vue/test-utils` aparecem no `package.json` ou no `package-lock.json`.
- [x] `git diff main --stat` só mostra arquivos novos do DS, do catálogo, dos testes e da skill, mais os acréscimos previstos em `app.css`, `App.tsx`, `vitest.config.ts` (se sobrar algo), `eslint.config.js` (se sobrar algo), `.gitignore` e `CLAUDE.md`. Também aparecem, por decisão da revisão adversária, as ressalvas "só v1 / tela v2 usa `design-system`" nas skills de `.claude/`, `.agents/` e `.cursor/skills/`, nas regras `.cursor/rules/*.mdc` e em `specs/_shared/frontend-ui-patterns.md`. A remoção de `frontend-standards-fisio.md` no `--stat` não é desta feature (foi feita pelo usuário). Nenhum arquivo de `components/ui`, `pages` ou layouts aparece.
- [x] Depois de `npm run build`, a rota `/design-system` não está no bundle de produção.
- [x] Uma tela v1 (login da clínica e uma listagem) está idêntica à `main`, com print comparativo.
- [x] A skill tem `SKILL.md` no formato das outras skills do projeto e aparece no Skill Map do `CLAUDE.md`.
- [x] `bash bin/verificar.sh`, `npm run types`, `npm run lint`, `npm run build` e `npm run test` passam.
- [x] Revisão adversária da branch inteira até APROVADO, antes da PR única.
- [x] Isolamento entre clínicas: não se aplica (sem dado nem API).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001` a `014`: todas as outras tarefas.

## Notas de Implementação

- **Branch:** `feat/design-system-v2` (esta tarefa fecha a branch e abre a PR única).
- **Exemplo no código:** `.claude/skills/frontend-ui-patterns/SKILL.md` (formato de skill) e o Skill Map do `CLAUDE.md`.
- **Skills:** `frontend-ui-patterns`, `revisao-adversaria`.

## Como testar na mão

Abrir o `/design-system` e passar por todas as seções em light e dark. Abrir o login da clínica e uma listagem da v1 e comparar com a `main`. Rodar `npm run build` e confirmar que a rota não está no bundle.
