# DsTooltip e DsButton

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

O botão é o componente mais usado e o primeiro que prova que o padrão de port funciona: mesma API do Vue, Tailwind com tokens `ds` e Radix por baixo. Ele depende do tooltip, porque o botão só de ícone sempre mostra um tooltip com o nome da ação.

## O que construir

- `DsTooltip` sobre o Radix Tooltip, com as mesmas props do Vue (texto e posição `top`, `right`, `bottom` ou `left`). Aparece no hover e no foco do teclado.
- `DsButton` com as mesmas props e defaults do Vue: variantes `primary`, `secondary`, `tertiary`, `destructive`, `destructive-secondary` e `destructive-tertiary`; tamanhos `sm`, `md`, `lg` e `full`; ícone à esquerda, à direita ou só ícone; `disabled`; `loading`; `type`; `tooltip`; `tooltipPlacement`. O `click` vira `onClick`, que não dispara com `disabled` nem `loading`. Só ícone mostra o tooltip (`tooltip` ou, na falta dele, `label`) e tem nome acessível. O ícone é um elemento React (lucide).
- As correções de contraste do dark mode que o Vue aplica no botão.
- Seções no catálogo com todas as combinações, em light e dark.

## Critérios de Aceite

- [x] Props, defaults e variantes iguais aos de `button/types.ts` e `tooltip/types.ts`, com os ajustes de API do plano (`onClick`, ícone como elemento).
- [x] Os 11 casos de `DsButton.test.ts` e os 3 de `DsTooltip.spec.ts` foram portados para Vitest + RTL e passam.
- [x] Teste: só ícone tem nome acessível e mostra o tooltip no hover e no foco do teclado.
- [x] Teste: `loading` e `disabled` não chamam `onClick`.
- [x] Visual de cada variante e tamanho no catálogo confere com o SCSS do `DsButton.vue`, em light e dark, com prints na evidência.
- [x] Nenhum arquivo de `components/ui`, `pages` ou layouts mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-fundacao-tokens-tema-e-catalogo` (tokens, `@theme ds` e catálogo).

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/button.tsx` (cva + Slot) e `resources/js/components/ui/tooltip.tsx` (Radix Tooltip).
- **Fonte da verdade:** `resources/design-system/components/button/` e `tooltip/`.
- **Skills:** `frontend-ui-patterns`, `frontend-react`, `frontend-testing`.

## Como testar na mão

Abrir `/design-system`, passar o mouse e dar Tab nos botões só de ícone (o tooltip aparece), clicar em um botão `loading` (nada acontece) e trocar para dark para conferir o contraste.
