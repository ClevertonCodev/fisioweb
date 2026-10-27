# Campos de documento: CPF, CNPJ, RG, CNH e passaporte

**Tipo:** História
**Plano:** `../plans/design-system-v2.md`
**Issue:** ainda não criada

## Descrição

No Vue, os campos de documento usam a biblioteca `maska`, que não vai entrar no projeto. As regras de `utils/brazilian-document.ts` viram funções puras de formatação e normalização, e os cinco campos ficam com o visual compartilhado (`document-field.scss`) do Vue.

## O que construir

- Funções puras com as mesmas regras do Vue: CPF `###.###.###-##`; CNPJ alfanumérico `**.***.***/****-##` (letras maiúsculas); RG com letras, dígitos e separadores `. / -` e espaço, até 20 caracteres, em maiúsculas; CNH com 11 dígitos; passaporte com 9 caracteres. Mais a validação que o Vue tiver para cada um.
- `DsCpfField`, `DsCnpjField`, `DsRgField`, `DsCnhField` e `DsPassportField` com as props e eventos de cada `types.ts`, construídos sobre o `DsInput`, aplicando a máscara enquanto se digita e ao colar.
- Seções no catálogo.

## Critérios de Aceite

- [x] Props e eventos iguais aos dos `types.ts` de `cpf`, `cnpj`, `rg`, `cnh` e `passport`.
- [x] Testes de tabela de cada função (entrada crua → valor formatado), incluindo colar com pontuação, CNPJ com letras, RG com `X` e prefixo de estado, e texto acima do limite.
- [x] Teste de cada campo: digitar e colar aplicam a máscara, e `onChange` recebe o valor no formato do Vue (com ou sem máscara, conferir no `.vue`).
- [x] O cursor não pula para o fim ao editar no meio do valor, conferido na mão e anotado na evidência.
- [x] `maska` não está no `package.json`.
- [x] Visual confere com o `document-field.scss` em light e dark, com prints na evidência.
- [x] Nenhum arquivo da v1 mudou.
- [x] Isolamento entre clínicas: não se aplica (componente sem dado).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `003-campos-de-texto-e-moeda` (`DsInput`).

## Notas de Implementação

- **Branch:** `feat/design-system-v2`
- **Exemplo no código:** `resources/js/components/ui/cpf-cnpj-input.tsx` (máscara em função pura).
- **Fonte da verdade:** `resources/design-system/utils/brazilian-document.ts`, `components/document/document-field.scss` e as pastas `cpf`, `cnpj`, `rg`, `cnh` e `passport`.
- **Skills:** `frontend-react`, `frontend-testing`.
- Usar só documentos fictícios ou gerados nos testes e nos prints, nunca documento de pessoa real.

## Como testar na mão

No `/design-system`, digitar e colar documentos fictícios em cada campo, editar um dígito no meio e conferir o formato e a posição do cursor.
