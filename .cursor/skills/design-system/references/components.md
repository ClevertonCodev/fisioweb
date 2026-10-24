# Componentes do DS v2

Tudo é importado de `@/components/ds`. As variantes, estados e exemplos vivos ficam em `/design-system` (só em dev), e o código dos exemplos em `resources/js/pages/dev/design-system/*Section.tsx`.

## Base

| Componente | Props principais |
|---|---|
| `DsButton` | `label`, `variant` (`primary`, `secondary`, `tertiary`, `destructive`, `destructive-secondary`, `destructive-tertiary`), `size` (`sm`, `md`, `lg`, `full`), `iconPosition` (`left`, `right`, `only`), `icon`, `loading`, `disabled`, `type`, `tooltip`, `tooltipPlacement`, `onClick`. Só ícone sempre mostra tooltip. |
| `DsTooltip` | `content` (`null` desliga), `placement`, `asChild`. |
| `DsThemeToggle`, `useDsTheme` | Alternam e lembram o `data-theme` (`light`/`dark`) no `<html>`. O estado é único, compartilhado entre instâncias e entre abas. O tema salvo é aplicado assim que o DS é importado. |
| `dsCn` | Junta classes conhecendo os nomes `ds`. |

## Campos

| Componente | Props principais | RHF |
|---|---|---|
| `DsInput` | `value`, `onValueChange`, `label`, `helper`, `type` (`text`, `email`, `password`, `tel`, `number`, `search`, `url`), `state` (`default`, `success`, `error`), `size` (`md`, `sm`), `iconLeft`, `iconRight`, `onEnterPressed`, `onCleared` | register |
| `DsTextarea` | `value`, `onValueChange`, `label`, `helper`, `state`, `rows`, `maxlength` (mostra o contador; com `0` não mostra). Com `register`, o contador acompanha os `defaultValues`, o `reset()` e o `setValue()`. | register |
| `DsMoneyInput` | `value: number \| null`, `onValueChange`, `currency` (`BRL`, `USD`, `EUR`), `maxDigits`, `label`, `helper`, `state`, `size`. Digitar entra pelos centavos (maquininha); colar ou arrastar substitui o valor | Controller |
| `DsSelect` (nativo) | `options`, `value`, `onValueChange`, `multiple`, `placeholder`, `label`, `helper`, `state`, `size` | register |
| `DsFieldSelect` | `options`, `value`, `onValueChange`, `mode` (`single`, `multi`, `search`, `multi-search`), `searchable`, `filterLocally`, `minSearchLength`, `multiDisplay`, `hideSelectedInMenu`, `hideApplyButton`, `footerLinkLabel`, `iconLeft`, `onOpen`, `onClose`, `onApply`, `onSearch`, `onFooterLinkClick`, `onBlur` (chamado quando o foco sai do gatilho e da lista, e ao escolher no modo single, que também chama `onClose`) | Controller |
| `DsFieldSelectOptions` | Variante enxuta do `DsFieldSelect` com bandeira (`option.flagCode`) | Controller |
| `DsCheckbox` | `checked` (boolean ou lista no modo grupo, com `value`), `onCheckedChange`, `label`, `description`, `indeterminate`, `disabled`, `onBlur` | Controller |
| `DsRadioGroup` + `DsRadio` | Grupo: `value`, `onValueChange`, `name`, `orientation`, `onBlur` (só quando o foco sai do grupo). Item: `value` (string ou número), `label`, `description`, `disabled` | Controller |
| `DsSwitch` | `checked`, `onCheckedChange`, `label`, `description`, `disabled`, `onBlur` | Controller |
| `DsCpfField`, `DsCnpjField` (alfanumérico), `DsRgField`, `DsCnhField`, `DsPassportField` | `value` (com máscara), `onValueChange`, `label`, `required`, `invalid`, `helperText`, `disabled` | register |
| `DsCountrySelect` | `value` (ISO, ex.: `BR`), `onValueChange`, `label`, `helper`, `state` | Controller |
| `DsPhoneField` | `value` (`+55 84 99999-9999`, ou `(84) 99999-9999` sem seletor), `onValueChange`, `showCountrySelector`, `defaultCountry`, `label`, `required`, `invalid`, `helperText`. Um `value` trocado por fora (ex.: `reset({ tel: '' })`) volta o país ao do valor, ou ao `defaultCountry`. Com `Controller`, passe `defaultValues`: `reset()` sem eles manda `undefined`, e o campo mantém o que mostrava (vale também para o `DsMoneyInput`) | Controller |
| `DsDatepicker` | `value: Date \| DateRange \| null`, `onValueChange`, `mode` (`range` padrão, `single`), `minDate`, `maxDate`, `presets`, `placeholder`, `trigger({ label, open })`. O range só emite no Aplicar, e pode sair com `end: null` (intervalo incompleto). Os atalhos são cortados para caber em `minDate`/`maxDate`: um atalho que fica todo fora aparece desabilitado, e escolher um leva o calendário ao mês do início. O calendário não passa do mês do `maxDate`. Uma data inválida no `value` (`new Date('')`) vale como vazio. Se `disabled` virar true com o painel aberto, ele fecha e descarta o que não foi aplicado. | Controller |
| `DsDateField` | `value` (AAAA-MM-DD ou `''`), `onChange`, `label`, `required`, `error`, `helper`, `min`, `max`. Digita DD/MM/AAAA ou escolhe no calendário (mês e ano em select). | Controller |
| `DsAvatarPhotoField` | `value: File \| null`, `currentUrl`, `onChange`, `name` (iniciais), `size`, `accept`, `validateSource`, `validateResult`. Recorte circular (zoom, giro); saída JPEG 512px. | — |
| `DsPhotoCropModal` | `file`, `initial`, `onCancel`, `onConfirm(cropped, params)`. | — |
| `DsTimepicker` | `value` (texto no formato `"HH:MM"`, mas pode vir parcial ou fora da faixa enquanto se digita, porque a máscara é a mesma do Vue: `"930"` vira `"93:0"`). Valide com `parseTime(v) !== null` no Zod. Se `disabled` virar true com a lista aberta, ela fecha e não reabre ao reabilitar. `onValueChange` (a cada digitação), `onChange` (ao confirmar), `prefix`, `placeholder`, `ariaLabel`, `disabled` | Controller |

## Feedback e estrutura

| Componente | Props principais |
|---|---|
| `DsBadge` | `variant` (`default`, `primary`, `info`, `success`, `warning`, `danger`, `new`), `dot`, `icon`, `children` |
| `DsFilterChips` | `chips` (`key`, `label`, `value`; mostra "Rótulo: valor"), `onRemove(chip)`, `onClear` (com ele aparece "Limpar filtros"), `clearLabel`. Vai logo abaixo da linha de filtros; sem chips não renderiza nada. A lista tem `aria-label="Filtros aplicados"` e cada × é "Remover filtro <texto>". |
| `DsAlert` | `variant` (`info`, `success`, `warning`, `danger`), `mode` (`compact`, `rich`), `title`, `time`, `actions`, `icon`, `dismissible`, `onDismiss`, `children`. Usa `role="alert"`. |
| `DsBanner` | `title`, `description`, `variant` (`brand`, `info`, `warning`), `ctaLabel`, `onCta`, `actions`, `dismissible` (padrão `true`), `onDismiss`. Usa `role="status"`. |
| `DsEmptyState` | `variant` (`empty`, `no-results`, `no-permission`, `error`), `title`, `description`, `icon`, `action`. Tem textos padrão por variante. |
| `DsCard` | `variant` (`default`, `outlined`, `elevated`, `brand`, `interactive`), `compact`, `horizontal`, `media`, `header` (h3/p estilizados), `corner`, `footer`, `children` |
| `DsKpi` | `label`, `value`, `delta`, `trend` (`up`, `down`, `neutral`), `icon`, `loading` |
| `DsList` | `items` (`icon`, `text`, `sub`, `meta` / `label`, `value`), `mode` (`text`, `kv`), `renderValue` |

## Navegação e overlays

| Componente | Props principais |
|---|---|
| `DsTabs` + `DsTabsPanel` | `tabs` (`key`, `label`, `icon`, `disabled`), `value`, `onValueChange`, `size` (`sm`, `md`, `lg`); painéis opcionais por `value` |
| `DsCollapse` | `items` (`key`, `title`, `content`), `value` (`null` = fechado e controlado), `onValueChange`, `mode` (`default`, `step`), `currentStep` |
| `DsSteps` | `steps` (`label`, `description`), `current`, `vertical` |
| `DsPagination` | `page`, `onPageChange`, `total`, `perPage` (20), `compact`, `itemLabel` (`itens`). Abaixo de 600px vira select de página. Um `page` fora do intervalo é corrigido, e o `onPageChange` recebe a página corrigida (45 itens com `page` 10 → `onPageChange(3)`). Com `total` 0 (lista carregando ou vazia) o resumo mostra "0 de 0 <itemLabel>", a página pedida é mantida e não há aviso; `page` não numérico vale 1. O "…" não é clicável nem focável. |
| `DsModal` | `open`, `onOpenChange`, `onClose`, `title`, `meta`, `size` (`sm`, `md`, `lg`, `full`), `closeOnBackdrop`, `footer`, `children` |
| `DsDrawer` | Mesmas do modal, mais `placement` (`left`, `right`, `bottom`), `size` (`sm`, `md`, `lg`, `xl`), `surfaceClass` |
| `DsDropdown` | `items` (`key`, `label`, `icon`, `badge`, `disabled`), `value`, `onValueChange`, `mode` (`text`, `checkbox`, `radio`), `placeholder`, `fixedLabel`, `menuTitle`, `menuVariant`, `menuWidth`, `menuAlign`, `icon`, `label` (vira `aria-label`) |
| `DsTable<T>` | `columns` (`key`, `label`, `sortable`...), `rows`, `rowKey`, `selectable`, `actions` (por linha, com `visible`), `bulkActions`, `loading`, `emptyLabel`, `disableSelectionCb`, `cells` (renderização por coluna), `onSort(coluna, direção)` (asc → desc → none), `onBulkAction(chave, linhas)`. Não confirma ação em lote; o `confirmationLabel` fica só no tipo. O `rowKey` é `keyof T & string` e é obrigatório quando a linha não tem `id`. A chave precisa ser única: sem isso, em dev aparece um aviso, e a seleção usa o próprio objeto da linha. Uma linha bloqueada por `disableSelectionCb` sai da seleção e nunca chega ao `onBulkAction`. As ações com `href` viram link, tanto na linha quanto no menu "Opções". O `href` é só para rota interna montada no código, nunca a partir de dado do usuário. |

## Utilitários exportados

`formatMoney`, `parseMoneyInput`, `applyMask`, `formatCpf`, `formatCnpj`, `formatRg`, `formatCnh`, `formatPassport`, `isValidCpf`, `isValidCnpj`, `get*ValidationError` (CPF, CNPJ, RG, CNH, passaporte, telefone), `formatInternationalPhone`, `formatNationalPhone`, `countryFlagEmoji`, `DS_COUNTRY_OPTIONS`, `COUNTRY_DIAL_CODES`, `countryFromInternational`, `formatTypedTime`, `parseTime`, `visiblePages`.
