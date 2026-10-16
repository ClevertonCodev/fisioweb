import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

import type { SelectState } from '../select/types';

export type PhoneFieldState = 'default' | 'error';

export interface PhoneFieldProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'defaultValue' | 'type' | 'onChange'
> {
    /**
     * Número formatado (no Vue: modelValue). Com seletor de país vem no formato
     * internacional ("+55 84 99999-9999"); sem seletor, no nacional ("(84) 99999-9999").
     */
    value?: string;
    onValueChange?: (value: string) => void;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    helperText?: string;
    placeholder?: string;
    showCountrySelector?: boolean;
    /** País inicial quando o valor ainda não tem DDI. */
    defaultCountry?: string;
    ref?: Ref<HTMLInputElement>;
}

export interface CountrySelectProps {
    /** Código ISO do país (no Vue: modelValue). */
    value?: string;
    onValueChange?: (value: string) => void;
    label?: string;
    helper?: ReactNode;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    state?: SelectState;
    id?: string;
    name?: string;
    className?: string;
    onBlur?: () => void;
    ref?: Ref<HTMLButtonElement>;
}
