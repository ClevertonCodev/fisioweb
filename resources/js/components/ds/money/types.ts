import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

import type { InputSize, InputState } from '../input/types';

export type MoneyCurrency = 'BRL' | 'USD' | 'EUR';

export interface MoneyInputProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    | 'type'
    | 'size'
    | 'value'
    | 'defaultValue'
    | 'readOnly'
    | 'autoComplete'
    | 'onChange'
> {
    /** Valor numérico controlado (no Vue: modelValue). */
    value?: number | null;
    defaultValue?: number | null;
    /** Novo valor numérico (no Vue: update:modelValue). */
    onValueChange?: (value: number | null) => void;
    currency?: MoneyCurrency;
    label?: string;
    helper?: ReactNode;
    placeholder?: string;
    state?: InputState;
    size?: InputSize;
    disabled?: boolean;
    readonly?: boolean;
    name?: string;
    id?: string;
    autocomplete?: string;
    /** Total máximo de dígitos, contando os centavos. */
    maxDigits?: number;
    ref?: Ref<HTMLInputElement>;
}
