# DsCountrySelect, DsPhoneField e formulário de exemplo

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

O telefone do DS tem seletor de país com bandeira e valida o número por país. O seletor de país usa o `DsFieldSelectOptions`. Esta tarefa fecha os campos de formulário com um exemplo que junta tudo num formulário RHF + Zod, o padrão que as telas v2 vão seguir.

## O que construir

- A lista de países e a bandeira, portadas de `constants/countries.ts` e `utils/country-flag.ts`.
- As regras de `utils/phone.ts` (formatação e `getPhoneValidationError`) como funções puras, sem `maska`.
- `DsCountrySelect` com as props do Vue, usando o `DsFieldSelectOptions` com busca.
- `DsPhoneField` com as props e estados do Vue (`default`, `error`), com país e número, e o valor no formato que o Vue emite.
- No catálogo, um formulário de exemplo com RHF + Zod que usa `DsInput`, `DsMoneyInput`, `DsCpfField`, `DsPhoneField`, `DsSelect`, `DsCheckbox` e `DsButton`, mostra erros de validação e exibe o valor enviado na tela.

## Critérios de Aceite

- [x] Props e eventos iguais aos de `country/types.ts` e `phone/types.ts`.
- [x] Os 5 casos de `phone.spec.ts` foram portados e passam, mais testes de tabela da formatação por país (Brasil fixo e celular, e ao menos dois países estrangeiros).
- [x] Teste: trocar o país muda a máscara e a validação; um número inválido mostra o erro.
- [x] Teste do formulário de exemplo: enviar vazio mostra os erros do Zod nos campos do DS, e enviar preenchido chama o submit com os valores esperados.
- [x] Busca de país por nome funciona pelo teclado.
- [x] Visual confere com o SCSS do Vue em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `003-campos-de-texto-e-moeda`
- `004-checkbox-radio-e-switch`
- `005-selects` (`DsFieldSelectOptions`)
- `006-campos-de-documento` (o `DsCpfField` no formulário de exemplo)

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/phone-input.tsx` e um formulário RHF + Zod existente, como `resources/js/pages/admin/clinic/ClinicEditPage.tsx`.
- **Fonte da verdade:** `resources/design-system/components/country/`, `phone/`, `constants/countries.ts`, `utils/phone.ts` e `utils/country-flag.ts`.
- **Skills:** `forms-shadcn`, `frontend-ddd` (`references/forms.md`), `frontend-testing`.
- Usar só números de telefone fictícios.

## Como testar na mão

No `/design-system`, escolher Portugal e depois Brasil no telefone e digitar números fictícios. Depois, enviar o formulário de exemplo vazio (aparecem os erros) e preenchido (o valor aparece na tela).
