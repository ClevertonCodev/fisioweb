# DsSelect, DsFieldSelect e DsFieldSelectOptions

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

Os selects do DS são os maiores componentes de campo do Vue: juntos, `DsFieldSelect` e `DsFieldSelectOptions` somam cerca de 1.400 linhas. Eles têm modo simples, múltiplo e com busca. No React, o comportamento de lista, teclado e portal vem do Radix e do cmdk. O `DsCountrySelect` (tarefa 007) usa o `DsFieldSelectOptions`.

## O que construir

- `DsSelect` (props do Vue: opções, `state`, `size`, `multiple`, rótulo, helper, disabled), sobre o Radix Select. Se o `multiple` do Vue não couber no Radix Select, usar o mesmo popover e lista do `DsFieldSelect`.
- `DsFieldSelect` com os modos `single`, `multi` e `search`, sobre Popover + cmdk.
- `DsFieldSelectOptions`, a lista de opções reutilizável, com a mesma API do Vue, porque outros componentes a consomem.
- `value` + `onChange` no lugar do `v-model`, no formato do Vue (valor único ou lista), compatível com RHF via `Controller`/`FormField`.
- Seções no catálogo com cada modo, incluindo uma lista longa para a busca.

## Critérios de Aceite

- [x] Props, defaults e o formato de `SelectOption` iguais aos de `select/types.ts`.
- [x] Os 18 casos de `DsSelect.test.ts` foram portados e passam.
- [x] Testes de `DsFieldSelect` nos três modos: abrir, filtrar por texto (search), marcar e desmarcar vários (multi) e limpar.
- [x] Teste de teclado: setas navegam, Enter escolhe, Esc fecha e o foco volta ao gatilho.
- [x] O popover não é cortado dentro de um container com `overflow: hidden` (portal).
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-fundacao-tokens-tema-e-catalogo`

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/select.tsx`, `select-options.tsx` e `command.tsx` (cmdk).
- **Fonte da verdade:** `resources/design-system/components/select/`.
- **Skills:** `forms-shadcn` (Select com Portal, RHF), `frontend-react`, `frontend-testing`.

## Como testar na mão

No `/design-system`, abrir cada select só pelo teclado, buscar uma opção na lista longa, marcar três opções no modo multi e fechar com Esc.
