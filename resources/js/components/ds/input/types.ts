import type { InputHTMLAttributes, ReactNode, Ref } from 'react';

export type InputState = 'default' | 'success' | 'error';
export type InputSize = 'md' | 'sm';
export type InputType =
    | 'text'
    | 'email'
    | 'password'
    | 'tel'
    | 'number'
    | 'search'
    | 'url';

export interface InputProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'type' | 'size' | 'value' | 'readOnly' | 'autoComplete'
> {
    /** Valor controlado (no Vue: modelValue). Sem ele, o campo é não controlado (ex.: register do RHF). */
    value?: string;
    /** Novo valor a cada digitação (no Vue: update:modelValue). */
    onValueChange?: (value: string) => void;
    label?: string;
    helper?: ReactNode;
    placeholder?: string;
    type?: InputType;
    state?: InputState;
    size?: InputSize;
    disabled?: boolean;
    readonly?: boolean;
    name?: string;
    id?: string;
    autocomplete?: string;
    /** Slot icon-left do Vue. */
    iconLeft?: ReactNode;
    /** Slot icon-right do Vue. */
    iconRight?: ReactNode;
    onEnterPressed?: () => void;
    onCleared?: () => void;
    ref?: Ref<HTMLInputElement>;
}
