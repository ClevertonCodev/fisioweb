# Feedback: DsBadge, DsAlert, DsBanner e DsEmptyState

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

Os componentes que dizem ao usuário o estado de algo. Nenhum tem primitivo Radix: são feitos do zero com Tailwind, cva e os tokens `ds`.

## O que construir

- `DsBadge` com as variantes `default`, `primary`, `info`, `success`, `warning`, `danger` e `new`, mais os tokens de status (`pending`, `progress`, `submitted`, `review`, `success`, `failed`, `expired`, `awaiting`) que o Vue usar.
- `DsAlert` com as variantes `info`, `success`, `warning` e `danger`, os modos `compact` e `rich`, e o fechar e as ações, se o Vue tiver.
- `DsBanner` com as variantes `brand`, `info` e `warning`.
- `DsEmptyState` com as variantes `empty`, `no-results`, `no-permission` e `error`, e o ícone como elemento React (lucide).
- Slots do Vue viram `children` ou props `ReactNode`, e emits viram `onX`.
- Seções no catálogo.

## Critérios de Aceite

- [x] Props, variantes e defaults iguais aos de `badge`, `alert`, `banner` e `empty-state` (`types.ts`).
- [x] Teste de render de cada variante e modo, e do callback de fechar ou de ação, onde existir.
- [x] O alerta de erro e o de aviso são anunciados por leitor de tela (`role` adequado, conferido no `.vue`).
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-fundacao-tokens-tema-e-catalogo`

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/badge.tsx`, `alert.tsx` e `status-badge.tsx`.
- **Fonte da verdade:** `resources/design-system/components/badge/`, `alert/`, `banner/` e `empty-state/`.
- **Skills:** `frontend-ui-patterns`, `frontend-testing`.

## Como testar na mão

No `/design-system`, conferir cada variante em light e dark e fechar um alerta.
