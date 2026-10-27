# DsTable

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

A tabela é o maior componente do DS (891 linhas no Vue) e o mais usado nas listagens das telas v2. Ela é genérica no tipo da linha, ordena, seleciona e tem ações por linha e em lote. Como no Vue, a tabela só avisa que uma ação em lote foi pedida e não abre confirmação. O `confirmationLabel` fica no tipo, sem comportamento, igual ao Vue.

## O que construir

- `DsTable` genérica no tipo da linha, com as props de `table/types.ts`: colunas (com `sortable`), linhas, `rowKey`, `selectable`, ações por linha (com `visible` e tooltip via `DsTooltip`), ações em lote, `loading` e `emptyLabel`.
- Os eventos `sort` e `bulk-action` viram `onSort(coluna, direção)` e `onBulkAction(chave, linhasSelecionadas)`, com o ciclo de direção do Vue (`asc`, `desc`, `none`). Os demais eventos do Vue também viram `onX`.
- A seleção de linhas e o "selecionar todas" usam o `DsCheckbox`. O ícone de cada ação é um elemento React.
- No catálogo, uma tabela de exemplo com dados fictícios, ordenável, selecionável, com ações e com os estados de carregamento e vazio.

## Critérios de Aceite

- [x] Props, tipos (`TableColumn`, `TableAction`, `TableBulkAction`, `SortDirection`) e defaults iguais aos do Vue, e a tabela é tipada pelo tipo da linha.
- [x] Os 9 casos de `DsTable.test.ts` foram portados e passam.
- [x] Teste: clicar no cabeçalho ordenável percorre `asc`, `desc` e `none` e chama `onSort`; selecionar todas e uma ação em lote chama `onBulkAction` com as linhas certas; uma ação com `visible` falso não aparece.
- [x] Teste: `loading` mostra o estado de carregamento; sem linhas, mostra `emptyLabel`.
- [x] O cabeçalho ordenável é operável por teclado e expõe `aria-sort`.
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou (a `DataTable` de `components/ui` continua igual).
- [x] Isolamento entre clínicas: não se aplica (componente sem dado; o exemplo usa dados fictícios).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-tooltip-e-botao` (`DsTooltip` nas ações)
- `004-checkbox-radio-e-switch` (`DsCheckbox` na seleção)

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/data-table.tsx` e `table.tsx`.
- **Fonte da verdade:** `resources/design-system/components/table/`.
- **Skills:** `forms-shadcn` (padrões de listagem), `frontend-react`, `frontend-testing`.

## Como testar na mão

No `/design-system`, ordenar uma coluna três vezes, selecionar todas, disparar uma ação em lote (o resultado aparece na tela do catálogo), passar o mouse numa ação por linha (tooltip) e alternar carregamento e vazio.
