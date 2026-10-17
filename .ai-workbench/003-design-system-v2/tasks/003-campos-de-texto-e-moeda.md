# DsInput, DsTextarea e DsMoneyInput

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

Os campos de texto são a base dos formulários das telas v2 e precisam funcionar com React Hook Form sem adaptador. A máscara de moeda do Vue vira uma função pura, sem biblioteca.

## O que construir

- `DsInput` com as props do Vue: `label`, `helper`, `placeholder`, `type` (`text`, `email`, `password`, `tel`, `number`, `search`, `url`), `state` (`default`, `success`, `error`), `size` (`md`, `sm`), `disabled`, `readonly`, `name`, `id` e `autocomplete`. Usa `value` e `onChange`, aceita `ref`, `onBlur` e as demais props nativas, e liga o rótulo e o helper ao campo por `id` e `aria-describedby`.
- `DsTextarea` com as props e estados do Vue.
- `DsMoneyInput` com as moedas `BRL`, `USD` e `EUR` e a mesma formatação do Vue, feita por uma função pura de formatação e parse.
- Seções no catálogo com cada estado, em light e dark.

## Critérios de Aceite

- [x] Props e defaults iguais aos de `input/types.ts`, `textarea/types.ts` e `money/types.ts`, com `value`/`onChange` no lugar de `modelValue`.
- [x] Os 20 casos de `DsInput.test.ts` e os 3 de `DsMoneyInput.spec.ts` foram portados e passam.
- [x] Teste de render e estados do `DsTextarea`.
- [x] Teste de tabela da função de moeda (entrada → texto exibido → valor numérico) nas três moedas.
- [x] Teste: os três campos funcionam dentro de um formulário RHF (`register` no input e `Controller`/`FormField` no money) e mostram o erro do Zod no estado `error`.
- [x] O `helper` é lido por leitor de tela (`aria-describedby`).
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-fundacao-tokens-tema-e-catalogo`

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/money-input.tsx` e `resources/js/components/ui/input.tsx`.
- **Fonte da verdade:** `resources/design-system/components/input/`, `textarea/` e `money/`.
- **Skills:** `forms-shadcn` (integração com RHF), `frontend-react`, `frontend-testing`.

## Como testar na mão

No `/design-system`, digitar em cada campo, ver os estados `success` e `error` e o helper, e digitar `123456` no money em BRL, USD e EUR, conferindo o formato.
