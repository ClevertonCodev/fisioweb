// fisioweb DS (versão 2) — ponto de import único.
// import { DsButton, DsInput, ... } from '@/components/ds';
// Só para telas v2; telas v1 continuam com components/ui (shadcn).

export { DsThemeToggle } from './theme/DsThemeToggle';
export type { DsThemeToggleProps } from './theme/DsThemeToggle';
export { DS_THEME_STORAGE_KEY, useDsTheme } from './theme/useDsTheme';
export type { DsTheme } from './theme/useDsTheme';

export { DsTooltip } from './tooltip/DsTooltip';
export type { TooltipPlacement, TooltipProps } from './tooltip/types';

export { DsButton } from './button/DsButton';
export type {
    ButtonIconPosition,
    ButtonProps,
    ButtonSize,
    ButtonTooltipPlacement,
    ButtonType,
    ButtonVariant,
} from './button/types';

export { dsCn } from './utils/ds-cn';

export { DsInput } from './input/DsInput';
export type {
    InputProps,
    InputSize,
    InputState,
    InputType,
} from './input/types';

export { DsTextarea } from './textarea/DsTextarea';
export type { TextareaProps, TextareaState } from './textarea/types';

export { DsMoneyInput } from './money/DsMoneyInput';
export {
    applyMoneyEdit,
    formatMoney,
    parseMoneyInput,
} from './money/money-format';
export type { MoneyCurrency, MoneyInputProps } from './money/types';

export { DsCheckbox } from './choice/DsCheckbox';
export { DsRadio, DsRadioGroup } from './choice/DsRadio';
export type {
    CheckboxProps,
    RadioGroupProps,
    RadioProps,
    RadioValue,
} from './choice/types';

export { DsSwitch } from './switch/DsSwitch';
export type { SwitchProps } from './switch/types';

export { DsFieldSelect } from './select/DsFieldSelect';
export { DsFieldSelectOptions } from './select/DsFieldSelectOptions';
export { DsSelect } from './select/DsSelect';
export type {
    FieldSelectMode,
    FieldSelectOptionsProps,
    FieldSelectProps,
    SelectOption,
    SelectProps,
    SelectSize,
    SelectState,
    SelectValue,
} from './select/types';

export { countryFlagEmoji } from './utils/country-flag';

export {
    applyMask,
    formatCnh,
    formatCnpj,
    formatCpf,
    formatPassport,
    formatRg,
    getCnhValidationError,
    getCnpjValidationError,
    getCpfValidationError,
    getPassportValidationError,
    getRgValidationError,
    normalizeCnpj,
    normalizeDocumentDigits,
    normalizeRg,
} from './document/brazilian-document';
export {
    DsCnhField,
    DsCnpjField,
    DsCpfField,
    DsPassportField,
    DsRgField,
} from './document/DsDocumentFields';
export type {
    CnhFieldProps,
    CnpjFieldProps,
    CpfFieldProps,
    DocumentFieldProps,
    PassportFieldProps,
    RgFieldProps,
} from './document/types';

export {
    COUNTRY_DIAL_CODES,
    DS_COUNTRY_OPTIONS,
    countryFromInternational,
} from './phone/countries';
export { DsCountrySelect } from './phone/DsCountrySelect';
export { DsPhoneField } from './phone/DsPhoneField';
export {
    formatInternationalPhone,
    formatNationalPhone,
    getPhoneValidationError,
    normalizePhoneDigits,
} from './phone/phone';
export type {
    CountrySelectProps,
    PhoneFieldProps,
    PhoneFieldState,
} from './phone/types';

export { DsBadge } from './badge/DsBadge';
export type { BadgeProps, BadgeVariant } from './badge/DsBadge';

export { DsAlert } from './alert/DsAlert';
export type { AlertMode, AlertProps, AlertVariant } from './alert/DsAlert';

export { DsBanner } from './banner/DsBanner';
export type { BannerProps, BannerVariant } from './banner/DsBanner';

export { DsEmptyState } from './empty-state/DsEmptyState';
export type {
    EmptyStateProps,
    EmptyStateVariant,
} from './empty-state/DsEmptyState';

export { DsCard } from './card/DsCard';
export type { CardProps, CardVariant } from './card/DsCard';

export { DsKpi } from './kpi/DsKpi';
export type { KpiProps, KpiTrend } from './kpi/DsKpi';

export { DsList } from './list/DsList';
export type { ListItem, ListMode, ListProps } from './list/DsList';

export { DsCollapse } from './collapse/DsCollapse';
export type {
    CollapseItem,
    CollapseMode,
    CollapseProps,
} from './collapse/DsCollapse';

export { DsTabs, DsTabsPanel } from './tabs/DsTabs';
export type { Tab, TabsProps, TabsSize } from './tabs/DsTabs';

export { DsSteps } from './steps/DsSteps';
export type { Step, StepState, StepsProps } from './steps/DsSteps';

export { DsPagination, visiblePages } from './pagination/DsPagination';
export type { PaginationProps } from './pagination/DsPagination';

export { DsModal } from './modal/DsModal';
export type { ModalProps, ModalSize } from './modal/DsModal';

export { DsDrawer } from './drawer/DsDrawer';
export type {
    DrawerPlacement,
    DrawerProps,
    DrawerSize,
} from './drawer/DsDrawer';

export { DsFilterChips } from './filter-chips/DsFilterChips';
export type {
    FilterChip,
    FilterChipsProps,
} from './filter-chips/DsFilterChips';

export { DsDropdown } from './dropdown/DsDropdown';
export type {
    DropdownItem,
    DropdownMode,
    DropdownProps,
} from './dropdown/DsDropdown';

export { DsTimepicker } from './timepicker/DsTimepicker';
export type { DsTimepickerProps } from './timepicker/DsTimepicker';
export { formatTypedTime, parseTime } from './timepicker/time-format';

export { DsTable } from './table/DsTable';
export type {
    SortDirection,
    TableAction,
    TableBulkAction,
    TableCellRenderer,
    TableColumn,
    TableProps,
} from './table/types';

export { DsDatepicker } from './datepicker/DsDatepicker';
export type {
    DateRange,
    DatepickerMode,
    DatepickerPreset,
    DatepickerProps,
    DatepickerTriggerState,
    DatepickerValue,
} from './datepicker/types';

export { DsDateField } from './date-field/DsDateField';

export { DsAvatarPhotoField } from './photo/DsAvatarPhotoField';
export { DEFAULT_CROP, DsPhotoCropModal } from './photo/DsPhotoCropModal';
export type { CropParams } from './photo/DsPhotoCropModal';
