# Overlays: DsModal, DsDrawer e DsDropdown

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

No Vue, os overlays implementam à mão o focus trap, o Esc, o portal e a navegação por teclado. No React, isso vem do Radix Dialog e do Radix DropdownMenu, e o visual e a API seguem o DS.

## O que construir

- `DsModal` sobre o Radix Dialog, com os tamanhos `sm`, `md`, `lg` e `full`, título, conteúdo e rodapé de ações (conforme os slots do Vue), `open` + `onClose` no lugar do `v-model`, e as regras do Vue para fechar ao clicar fora.
- `DsDrawer` sobre o Radix Dialog, com as posições `right` e `bottom` e os tamanhos `sm`, `md`, `lg` e `xl`.
- `DsDropdown` sobre o Radix DropdownMenu, com os modos `text`, `checkbox` e `radio`, ícone no gatilho e nos itens (elemento React), e os eventos do Vue como callbacks.
- Seções no catálogo com um botão que abre cada overlay.

## Critérios de Aceite

- [x] Props, tamanhos, modos e defaults iguais aos de `modal`, `drawer` e `dropdown` (`types.ts`).
- [x] Os casos de `DsModal.test.ts` (10), `DsDrawer.test.ts` (17) e `DsDropdown.test.ts` (10) foram portados e passam.
- [x] Teste: modal e drawer prendem o foco, fecham com Esc, chamam `onClose` e devolvem o foco ao gatilho.
- [x] Teste: o dropdown abre com Enter e com a seta para baixo, as setas navegam, Enter escolhe, Esc fecha, e os modos checkbox e radio marcam os itens.
- [x] O scroll da página fica travado com o modal aberto.
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-tooltip-e-botao` (os gatilhos e as ações dos overlays usam `DsButton`).

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/dialog.tsx`, `sheet.tsx` e `dropdown-menu.tsx`.
- **Fonte da verdade:** `resources/design-system/components/modal/`, `drawer/` e `dropdown/`.
- **Skills:** `forms-shadcn` (Dialog), `frontend-react`, `frontend-testing`.

## Como testar na mão

No `/design-system`, abrir cada overlay pelo teclado, dar Tab até o fim (o foco não sai), fechar com Esc (o foco volta ao botão) e usar o dropdown nos três modos.
