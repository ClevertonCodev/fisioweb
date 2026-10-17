# DsCheckbox, DsRadio e DsSwitch

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

Os controles de escolha binária e única do DS, sobre os primitivos Radix, para que teclado e leitor de tela funcionem sem código próprio.

## O que construir

- `DsCheckbox` sobre o Radix Checkbox, `DsRadio` sobre o Radix RadioGroup e `DsSwitch` sobre o Radix Switch, cada um com as props, estados e defaults do Vue (rótulo, descrição, disabled, indeterminado onde o Vue tiver), visual 1:1 em light e dark.
- `checked`/`value` + `onChange` no lugar do `v-model`, aceitando `name` e `ref` para uso com RHF.
- Seções no catálogo.

## Critérios de Aceite

- [x] Props e defaults iguais aos de `choice/types.ts` e `switch/types.ts`.
- [x] Os casos de `DsCheckbox.test.ts` (12), `DsRadio.test.ts` (11) e `DsSwitch.test.ts` (10) foram portados e passam.
- [x] Teste: Espaço marca e desmarca o checkbox e o switch; as setas trocam o radio selecionado no grupo; disabled não muda.
- [x] Clicar no rótulo alterna o controle.
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-fundacao-tokens-tema-e-catalogo`

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/checkbox.tsx`, `radio-group.tsx` e `switch.tsx`.
- **Fonte da verdade:** `resources/design-system/components/choice/` e `switch/`.
- **Skills:** `frontend-ui-patterns`, `frontend-testing`.

## Como testar na mão

No `/design-system`, operar cada controle só com Tab, Espaço e setas, e conferir os estados disabled e o dark.
