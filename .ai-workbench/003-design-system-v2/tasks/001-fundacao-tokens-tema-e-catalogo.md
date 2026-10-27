# Fundação do DS: tokens, fontes, tema e catálogo de dev

**Tipo:** Tarefa
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

Hoje o `npm run test` quebra porque o Vitest tenta rodar os testes da pasta Vue `resources/design-system/`. Além disso, nenhum token do DS existe no SPA. Esta tarefa monta a base que todas as outras usam: tira a pasta Vue do caminho, traz os tokens e as fontes, cria o tema dark e abre a página de catálogo onde cada componente vai ser conferido.

## O que construir

- A pasta Vue sai do Vitest, do ESLint e do git, mas continua no disco como referência.
- Os tokens do DS (cores, tipografia, espaçamento, raio, sombra, breakpoints, gradientes, superfícies e conteúdos semânticos) passam a existir como variáveis `--ds-*`, copiadas 1:1 do `tokens.css` e do SCSS do Vue. O nome Paytour sai e o prefixo `--ds-v2-` vira `--ds-`. Os valores dark ficam sob `[data-theme="dark"]`.
- As fontes Poppins e Geist Mono são carregadas, e o Tailwind ganha utilitários com namespace `ds` (`bg-ds-*`, `text-ds-*`, `font-ds`, `font-ds-mono`, `rounded-ds-*`, `shadow-ds-*`) apontando para as variáveis.
- O `body`, os tokens shadcn e o bloco `.dark` existente não mudam.
- O `DsThemeToggle` (botão que alterna `data-theme` no `<html>` e lembra a escolha) e o hook que reaplica o tema salvo ao montar.
- A página de catálogo em `/design-system`, só em dev, sem login e fora dos layouts admin e clinic. Ela tem o toggle de tema, uma seção de tokens (paleta, escala tipográfica, raios, sombras) e espaço para as seções de componentes das próximas tarefas. A rota é registrada só quando `import.meta.env.DEV` e não entra no bundle de produção.
- O ponto de import único `@/components/ds`, que as próximas tarefas preenchem.

Sem backend, sem API, sem papel e sem dado.

## Critérios de Aceite

- [x] `npm run test` passa e não lista nenhum arquivo de `resources/design-system/`.
- [x] `npm run lint` não analisa `resources/design-system/`, e `git status` não mostra mais a pasta.
- [x] Todos os tokens do `tokens.css` e de `_colors.scss`, `_typography.scss`, `_spacing.scss` e `_breakpoints.scss` existem como `--ds-*`, com os mesmos valores, e os overrides dark existem sob `[data-theme="dark"]`.
- [x] Nenhum token shadcn (`--primary`, `--background`...) nem o `--font-sans` mudou: uma tela da v1 (login da clínica, por exemplo) fica idêntica antes e depois, com print comparativo.
- [x] `/design-system` abre em `composer run dev` e mostra a paleta, a tipografia em Poppins e Geist Mono, os raios e as sombras.
- [x] O `DsThemeToggle` troca `data-theme` entre `light` e `dark`, a troca muda as cores do catálogo, e a escolha continua depois de recarregar a página.
- [x] Teste: o toggle aplica e grava o tema, reaplica o tema salvo ao montar e não quebra quando o `localStorage` lança erro.
- [x] Teste: a rota `/design-system` só é registrada quando `DEV` é verdadeiro.
- [x] Depois de `npm run build`, nenhum chunk contém o catálogo, conferido com busca no `public/build`.
- [x] Isolamento entre clínicas: não se aplica (não há dado nem API), e o `SUMMARY.md` da evidência diz isso.
- [x] `npm run types`, `npm run lint`, `npm run build` e `npm run test` passam.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/css/app.css` (o bloco `@theme inline` existente mostra o formato do Tailwind v4) e `resources/js/App.tsx` (onde as rotas são montadas).
- **Fonte da verdade:** `resources/design-system/styles/tokens.css` e `styles/*.scss`.
- **Skills:** `frontend-ui-patterns`, `frontend-react`, `frontend-testing`.
- Os componentes não usam a variante `dark:` do Tailwind. O dark vem só da troca das variáveis.

## Como testar na mão

1. `composer run dev` e abrir `http://localhost:<porta>/design-system`.
2. Conferir a paleta e a tipografia contra o `tokens.css`. Clicar no toggle, ver o tema escuro e recarregar: o tema continua escuro.
3. Abrir `/clinica/login` e conferir que nada mudou (fonte Inter, cores teal).
4. `npm run build` e confirmar que `/design-system` não existe no build.
