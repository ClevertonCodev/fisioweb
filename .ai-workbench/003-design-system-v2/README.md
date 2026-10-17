# 003 · Design system da versão 2

Porta para React (Tailwind + Radix) os 35 componentes e os tokens do design system Vue + SCSS, com dark mode e um catálogo só de dev, para que as telas da versão 2 sejam montadas sem reinventar UI e sem mexer em nada da v1.

- **Status:** concluída (revisão adversária em 3 rodadas; os 3 Major da rodada 3 foram corrigidos depois da rodada e aceitos pelo usuário em 2026-10-16)
- **Branch:** `feat/design-system-v2` (uma PR só, por decisão do usuário)
- **Plano:** [`plans/design-system-v2.md`](plans/design-system-v2.md)
- **Módulos:** só SPA, sem backend.
  - **Novos:** `components/ds`, a página e a rota de dev `/design-system` (`pages/dev`, `routes/dev-routes.tsx`), `test/ds`, `css/ds/tokens.css` e a skill `design-system`, com espelho em `.agents/skills`.
  - **Acréscimos:**
    - `resources/css/app.css`: import dos tokens e das fontes;
    - `resources/js/app.tsx`: rota de dev;
    - `vitest.config.ts`: exclui `.claude/**`, porque os `.test.cjs` da skill `security-audit` usam `node:test` e quebravam o `npm run test` já na `main`;
    - skills `frontend-ui-patterns`, `forms-shadcn`, `implementar-tarefa` e `architecture-paradigm-modular-monolith` (em `.claude/`, `.agents/` e, onde não é atalho, `.cursor/skills/`): passam a dizer que valem só para a v1, ou apontam a `design-system` para a v2;
    - `.cursor/rules/frontend-ui-patterns.mdc`, `fisioweb-skills.mdc` e `specify-rules.mdc`, e `specs/_shared/frontend-ui-patterns.md`: mesma ressalva v1 × v2;
    - `design-system` em `.claude/skills/` e `.cursor/skills/` (ambas canônicas; `bash bin/verificar-skills.sh`).
  - **Fora do git, só local:** `CLAUDE.md` e `docs/ai-harness/DEFINITION_OF_DONE.md` ganharam a regra v1 × v2.
  - **Temporário:** as exclusões da pasta Vue no `eslint.config.js` e no `.gitignore` foram desfeitas quando a pasta foi apagada.

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| [001 · Fundação do DS: tokens, fontes, tema e catálogo de dev](tasks/001-fundacao-tokens-tema-e-catalogo.md) | concluída | | |
| [002 · DsTooltip e DsButton](tasks/002-tooltip-e-botao.md) | concluída | | |
| [003 · DsInput, DsTextarea e DsMoneyInput](tasks/003-campos-de-texto-e-moeda.md) | concluída | | |
| [004 · DsCheckbox, DsRadio e DsSwitch](tasks/004-checkbox-radio-e-switch.md) | concluída | | |
| [005 · DsSelect, DsFieldSelect e DsFieldSelectOptions](tasks/005-selects.md) | concluída | | |
| [006 · Campos de documento: CPF, CNPJ, RG, CNH e passaporte](tasks/006-campos-de-documento.md) | concluída | | |
| [007 · DsCountrySelect, DsPhoneField e formulário de exemplo](tasks/007-pais-telefone-e-formulario-exemplo.md) | concluída | | |
| [008 · Feedback: DsBadge, DsAlert, DsBanner e DsEmptyState](tasks/008-feedback-badge-alert-banner-empty.md) | concluída | | |
| [009 · Estrutura: DsCard, DsKpi e DsList](tasks/009-estrutura-card-kpi-list.md) | concluída | | |
| [010 · Navegação: DsCollapse, DsTabs, DsSteps e DsPagination](tasks/010-navegacao-collapse-tabs-steps-pagination.md) | concluída | | |
| [011 · Overlays: DsModal, DsDrawer e DsDropdown](tasks/011-overlays-modal-drawer-dropdown.md) | concluída | | |
| [012 · DsDatepicker](tasks/012-datepicker.md) | concluída | | |
| [013 · DsTimepicker](tasks/013-timepicker.md) | concluída | | |
| [014 · DsTable](tasks/014-tabela.md) | concluída | | |
| [015 · Limpeza da pasta Vue e skill do design system v2](tasks/015-limpeza-e-skill-design-system-v2.md) | concluída | | |

## Pastas

- `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.
- Referência local durante o port: `resources/design-system/` (DS Vue, fora do git, apagado na última tarefa).
