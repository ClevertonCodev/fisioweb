# DsTimepicker

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

O `DsTimepicker` existe no Vue, mas não está no `index.ts` de lá. Ele entra no port porque a decisão foi portar todos os componentes. Tem campo digitável com formatação do horário e uma lista para escolher.

## O que construir

- `DsTimepicker` com as props do Vue (definidas no próprio `.vue`, não há `types.ts`), a formatação do horário digitado (a função `formatTypedTime` vira função pura) e a escolha pela lista.
- `value` + `onChange` com o horário no formato do Vue.
- O ícone de relógio do lucide.
- Seção no catálogo.

## Critérios de Aceite

- [x] Props, defaults e formato do valor iguais aos do `DsTimepicker.vue`.
- [x] Teste de tabela da formatação do horário digitado (por exemplo `930` → `09:30`, conforme as regras do Vue, e valores inválidos).
- [x] Teste: escolher um horário na lista chama `onChange`; o campo e a lista são operáveis pelo teclado.
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-fundacao-tokens-tema-e-catalogo`

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/popover.tsx`.
- **Fonte da verdade:** `resources/design-system/components/timepicker/DsTimepicker.vue`.
- **Skills:** `frontend-react`, `frontend-testing`.

## Como testar na mão

No `/design-system`, digitar horários com e sem dois-pontos, escolher um na lista e conferir em dark.
