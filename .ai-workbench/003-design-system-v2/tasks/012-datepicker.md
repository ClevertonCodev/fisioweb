# DsDatepicker

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

O datepicker do Vue tem 775 linhas de calendário próprio. No React, o calendário vem do react-day-picker com date-fns em pt-BR, que já estão instalados, e o campo, os presets e o visual seguem o DS.

## O que construir

- `DsDatepicker` com os modos `single` e `range`, `minDate`, `maxDate`, presets (atalhos como "últimos 7 dias", conforme o tipo `DatepickerPreset` do Vue) e o mesmo valor do Vue (`Date`, `DateRange` ou `null`) em `value` + `onChange`.
- O calendário sobre o react-day-picker, num popover com o visual do DS, com os dias da semana e os meses em português.
- Seções no catálogo com os dois modos, com limites e com presets.

## Critérios de Aceite

- [x] Props, modos e defaults iguais aos de `datepicker/types.ts`.
- [x] Os 13 casos de `DsDatepicker.test.ts` foram portados e passam.
- [x] Teste: datas fora de `minDate` e `maxDate` ficam desabilitadas; um preset preenche o intervalo; o intervalo só é emitido completo, ou como o Vue fizer.
- [x] Teste de teclado: o calendário abre pelo teclado, as setas mudam o dia e Esc fecha devolvendo o foco.
- [x] Os testes fixam a data atual (fake timers), para não depender do dia em que rodam.
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-fundacao-tokens-tema-e-catalogo`

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/calendar.tsx` (react-day-picker) e `popover.tsx`.
- **Fonte da verdade:** `resources/design-system/components/datepicker/`.
- **Skills:** `frontend-react`, `frontend-testing`.

## Como testar na mão

No `/design-system`, escolher uma data, um intervalo e um preset, tentar uma data fora do limite e repetir em dark.
