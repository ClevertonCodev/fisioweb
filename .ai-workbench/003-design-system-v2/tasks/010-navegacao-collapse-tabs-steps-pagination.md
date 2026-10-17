# Navegação: DsCollapse, DsTabs, DsSteps e DsPagination

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

Os componentes que levam o usuário entre partes de um conteúdo. O Collapse e as Tabs usam Radix. Steps e Pagination são feitos do zero.

## O que construir

- `DsCollapse` sobre o Radix Collapsible, com os modos `default` e `step` e o estado aberto controlado e não controlado, como no Vue.
- `DsTabs` sobre o Radix Tabs, com os tamanhos `sm`, `md` e `lg` e o ícone por aba como elemento React.
- `DsSteps` com os estados `done`, `current` e `pending`.
- `DsPagination` com a mesma lógica de páginas e reticências do Vue, e o `onChange` da página.
- Seções no catálogo.

## Critérios de Aceite

- [x] Props, modos e defaults iguais aos de `collapse`, `tabs`, `steps` e `pagination` (`types.ts`).
- [x] Os casos de `DsCollapse.test.ts` (8), `DsTabs.test.ts` (8), `DsSteps.test.ts` (10) e `DsPagination.test.ts` (16) foram portados e passam.
- [x] Teste de teclado: setas trocam de aba, Enter e Espaço abrem e fecham o collapse, e a paginação é operável por Tab e Enter.
- [x] Teste: `aria-current` na página atual e no passo atual.
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-fundacao-tokens-tema-e-catalogo`

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/tabs.tsx`, `collapsible.tsx` e `table-pagination.tsx`.
- **Fonte da verdade:** `resources/design-system/components/collapse/`, `tabs/`, `steps/` e `pagination/`.
- **Skills:** `frontend-ui-patterns`, `frontend-testing`.

## Como testar na mão

No `/design-system`, navegar pelas abas com as setas, abrir e fechar o collapse pelo teclado e andar pela paginação de 20 páginas, conferindo as reticências.
