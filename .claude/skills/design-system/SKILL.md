---
name: design-system
description: Design system das telas da versão 2 do fisioweb (componentes Ds* em resources/js/components/ds, tokens --ds-*, Poppins/Geist Mono, dark mode por data-theme). Use ao criar ou estilizar qualquer tela v2, ao escolher entre um componente Ds* e um shadcn, ao montar formulário v2 com React Hook Form, ou ao mexer em tokens, tema escuro ou no catálogo /design-system. Telas v1 continuam com frontend-ui-patterns e shadcn.
metadata:
  domain: ui
  triggers: tela v2, versão 2, design system, Ds*, DsButton, DsInput, tokens ds, --ds-, data-theme, tema escuro, dark mode, catálogo, /design-system, Poppins
  scope: implementation
  output-format: code
  related-skills: frontend-ui-patterns, forms-shadcn, frontend-react, frontend-testing
---

# Design system v2 (fisioweb)

Port 1:1 do design system Vue + SCSS para React. **Só para telas da versão 2.**

| A tela é... | Use |
|---|---|
| v1 (o que já existe: `AdminLayout`, `ClinicLayout`, páginas atuais) | shadcn de `components/ui` + skill [`frontend-ui-patterns`](../frontend-ui-patterns/SKILL.md) |
| v2 (nova) | `@/components/ds` + esta skill |

Nunca misture as duas numa mesma tela, e nunca altere `components/ui` para parecer com o DS.

## Onde está

- Componentes: `resources/js/components/ds/<componente>/`, importados de `@/components/ds`.
- Tokens: `resources/css/ds/tokens.css` (variáveis `--ds-*` + `@theme` com namespace `ds` + variante `ds-dark:`).
- Catálogo vivo: `/design-system`, só em desenvolvimento (`composer run dev`). Mostra cada componente em todas as variantes, nos dois temas. Ele não existe no build de produção.
- Testes: `resources/js/test/ds/`.

## Regras

1. **Classes com `dsCn`** (de `@/components/ds`), nunca com o `cn` de `lib/utils`. O tailwind-merge padrão apaga `text-ds-body-xs` quando há também `text-ds-primary-80`.
2. **Só tokens do DS**: `bg-ds-*`, `text-ds-*`, `border-ds-*`, `font-ds`, `font-ds-mono`, `text-ds-body-xs`/`caption`/`body-sm`..., `rounded-ds-*`, `shadow-ds-*`. Nada de `bg-primary`, `text-foreground` (são da v1) nem hex solto.
3. **Tema escuro**: `DsThemeToggle` ou `useDsTheme` aplicam `data-theme="dark"` no `<html>`. Os tokens semânticos (`surface`, `content`, `status`, `border`) já trocam de valor sozinhos. O tema tem fonte única: todas as instâncias ficam em sincronia, e o seletor é `:root[data-theme]`, então um `data-theme` em outro elemento (o Toaster do sonner, por exemplo) não troca os tokens. Para uma regra só do escuro, use a variante `ds-dark:`, nunca `dark:` (que é da v1 e do `prefers-color-scheme`).
4. **Tela v2 rola no próprio contêiner.** `html` e `body` da v1 têm `overflow: hidden` e o `#root` tem `height: 100%`. A raiz da tela v2 precisa de `h-full overflow-y-auto` (veja `pages/dev/DesignSystemPage.tsx`).
5. **Ícones lucide como elemento**: `icon={<Plus />}`. O DS Vue usava strings Phosphor (`ph-plus`).
6. **Fonte**: os componentes aplicam `font-ds` (Poppins) na própria raiz. Uma tela v2 põe `font-ds` no contêiner raiz.
7. **Paleta fisioweb (azul `#4B62A1`)**: `primary-80` é a marca (fundo de botão, selecionado no claro), `primary-100` o hover no claro, `primary-70` o hover e o preenchimento de selecionado no escuro (branco por cima passa no AA), `primary-60` o texto da marca no escuro e `primary-20` o brand-soft. Texto na cor da marca precisa de `ds-dark:text-ds-primary-60`, porque `primary-80` sobre o card escuro fica em 2,8:1. Prefira os tokens semânticos (`content-brand`, `surface-brand-subtle`), que já trocam sozinhos.

## API em relação ao DS Vue

| Vue | React |
|---|---|
| `v-model` / `modelValue` | `value` + `onValueChange` (campos), `checked` + `onCheckedChange` (checkbox/switch), `open` + `onOpenChange` (overlays), `page` + `onPageChange` (paginação) |
| `emit('x')` | prop `onX` |
| slot nomeado | prop `ReactNode` com o mesmo nome (`footer`, `actions`, `header`, `corner`, `media`, `action`) |
| slot default | `children` |
| slot por item (`DsCollapse`, `DsList` kv) | `items[].content` / `renderValue(item, index)` |

Componentes que aceitam `value` também funcionam não controlados (sem `value`).

Diferenças de propósito:
- `DsRadio` precisa estar dentro de `DsRadioGroup`, que guarda o valor e dá a navegação por setas. O Vue não tinha grupo.
- `DsSelect` é `<select>` nativo (aceita `multiple`). `DsFieldSelect` é a lista própria com busca e multi (Popover do Radix).
- `DsTabs` ganhou `DsTabsPanel`, que é opcional.
- Bandeira de país é emoji (`countryFlagEmoji`): as imagens do Vue não existem no fisioweb.
- Telefone sem libphonenumber: o Brasil tem formato completo; os outros países, DDI + grupos de 3. A validação é a mesma do Vue (`getPhoneValidationError`).

## Formulário v2 (React Hook Form + Zod)

- **`register`** funciona direto em: `DsInput`, `DsTextarea`, `DsSelect` e nos campos de documento (`DsCpfField`, `DsCnpjField`, `DsRgField`, `DsCnhField`, `DsPassportField`). Os documentos mascaram no próprio input, então o RHF já recebe o valor com máscara.
- **`Controller`** (ou `FormField`) em: `DsMoneyInput` (número), `DsPhoneField`, `DsFieldSelect`, `DsCountrySelect`, `DsCheckbox`, `DsSwitch`, `DsRadioGroup`, `DsDatepicker`, `DsDateField`, `DsTimepicker`.
- Erro: `state="error"` + `helper={mensagem}` nos campos de moldura; `invalid` + `helperText` nos de documento e telefone.
- Validações prontas: `getCpfValidationError`, `getCnpjValidationError`, `getRgValidationError`, `getCnhValidationError`, `getPassportValidationError`, `getPhoneValidationError`.
- **CNPJ alfanumérico:** o `DsCnpjField` e o `getCnpjValidationError` aceitam letras (formato novo da Receita), mas o backend (`ValidationHelper::validateCnpj`) ainda só aceita CNPJ numérico. Até o backend aceitar, um formulário v2 que manda CNPJ para a API deve validar também com `isValidCnpj` de `@/lib/br-document-validation` (alinhado ao PHP), para não deixar passar um valor que vai voltar 422.
- No `Controller`, passe sempre `field.onBlur` em `onBlur`. Sem isso, os modos `onBlur` e `onTouched` do RHF não validam.
- Exemplo completo: `pages/dev/design-system/ExampleForm.tsx`.

## Catálogo de componentes

Veja [`references/components.md`](references/components.md) para a lista com as props principais.

## Checklist de tela v2

- [ ] Só `@/components/ds` (nenhum import de `components/ui`).
- [ ] Classes com `dsCn` e tokens `ds`.
- [ ] Raiz com `h-full overflow-y-auto font-ds bg-ds-surface-body text-ds-content-primary`.
- [ ] Conferida no `/design-system` e na tela, em claro e escuro.
- [ ] Formulário com RHF + Zod (register ou Controller conforme a lista acima).
