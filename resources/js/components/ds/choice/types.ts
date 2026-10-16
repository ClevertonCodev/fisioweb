import type { FocusEventHandler, ReactNode, Ref } from 'react';

export interface CheckboxProps {
    /**
     * Estado marcado (no Vue: modelValue). Boolean para um checkbox sozinho, ou a
     * lista de valores marcados no modo grupo (junto com `value`).
     */
    checked?: boolean | string[];
    /** Valor deste item no modo grupo. */
    value?: string;
    onCheckedChange?: (next: boolean | string[]) => void;
    /** Repassado ao controle; o React Hook Form usa para o modo onBlur/onTouched. */
    onBlur?: FocusEventHandler<HTMLButtonElement>;
    label?: string;
    description?: string;
    disabled?: boolean;
    indeterminate?: boolean;
    name?: string;
    id?: string;
    className?: string;
    /** Slot default do Vue, usado quando não há label. */
    children?: ReactNode;
    ref?: Ref<HTMLButtonElement>;
}

export type RadioValue = string | number;

export interface RadioGroupProps {
    /** Valor selecionado (no Vue cada DsRadio recebia modelValue). */
    value?: RadioValue;
    defaultValue?: RadioValue;
    onValueChange?: (value: RadioValue) => void;
    /** Chamado só quando o foco sai do grupo (andar com as setas não conta). */
    onBlur?: FocusEventHandler<HTMLDivElement>;
    name?: string;
    disabled?: boolean;
    orientation?: 'vertical' | 'horizontal';
    className?: string;
    'aria-label'?: string;
    'aria-labelledby'?: string;
    children: ReactNode;
}

export interface RadioProps {
    value: RadioValue;
    label?: string;
    description?: string;
    disabled?: boolean;
    id?: string;
    className?: string;
    children?: ReactNode;
    ref?: Ref<HTMLButtonElement>;
}
