import type { ReactNode, Ref, SelectHTMLAttributes } from 'react';

export type SelectState = 'default' | 'success' | 'error';
export type SelectSize = 'md' | 'sm';
export type FieldSelectMode = 'single' | 'multi' | 'search' | 'multi-search';

export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    /** Código ISO do país (ex.: "br") para mostrar a bandeira. */
    flagCode?: string;
}

export type SelectValue = string | number | (string | number)[];

export interface SelectProps extends Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    'value' | 'defaultValue' | 'size' | 'multiple'
> {
    /** Valor controlado. */
    value?: SelectValue;
    defaultValue?: SelectValue;
    onValueChange?: (value: string | string[]) => void;
    options: SelectOption[];
    label?: string;
    helper?: ReactNode;
    placeholder?: string;
    state?: SelectState;
    size?: SelectSize;
    disabled?: boolean;
    multiple?: boolean;
    name?: string;
    id?: string;
    ref?: Ref<HTMLSelectElement>;
}

export interface FieldSelectProps {
    /** Valor selecionado. String para single/search, lista para multi. */
    value?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    options: SelectOption[];
    mode?: FieldSelectMode;
    label?: string;
    helper?: ReactNode;
    placeholder?: string;
    searchPlaceholder?: string;
    /** Mostra a busca mesmo fora dos modos search. */
    searchable?: boolean;
    /** false: a busca só avisa (onSearch) e quem chama filtra as opções. */
    filterLocally?: boolean;
    minSearchLength?: number;
    emptyMessage?: string;
    state?: SelectState;
    size?: SelectSize;
    disabled?: boolean;
    /** Asterisco vermelho no rótulo e aria-required no gatilho. */
    required?: boolean;
    hideApplyButton?: boolean;
    footerLinkLabel?: string;
    /** No modo multi, mostra só a quantidade no gatilho. */
    multiDisplay?: 'labels' | 'count';
    /** No modo multi, tira da lista os itens já escolhidos. */
    hideSelectedInMenu?: boolean;
    /** Ícone à esquerda do campo. */
    iconLeft?: ReactNode;
    id?: string;
    name?: string;
    className?: string;
    onBlur?: () => void;
    onOpen?: () => void;
    onClose?: () => void;
    onApply?: () => void;
    onFooterLinkClick?: () => void;
    onSearch?: (term: string) => void;
    ref?: Ref<HTMLButtonElement>;
}

/** DsFieldSelectOptions: o subconjunto do DsFieldSelect usado com bandeiras. */
export type FieldSelectOptionsProps = Pick<
    FieldSelectProps,
    | 'value'
    | 'onValueChange'
    | 'options'
    | 'label'
    | 'helper'
    | 'placeholder'
    | 'searchPlaceholder'
    | 'state'
    | 'size'
    | 'disabled'
    | 'iconLeft'
    | 'id'
    | 'name'
    | 'className'
    | 'onBlur'
    | 'ref'
> & { mode?: 'single' | 'multi' | 'search' };
