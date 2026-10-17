import type { FocusEventHandler, ReactNode, Ref } from 'react';

export interface SwitchProps {
    /** Ligado/desligado. */
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    /** Repassado ao controle; o React Hook Form usa para o modo onBlur/onTouched. */
    onBlur?: FocusEventHandler<HTMLButtonElement>;
    label?: string;
    description?: string;
    disabled?: boolean;
    name?: string;
    id?: string;
    className?: string;
    /** Conteúdo quando não há label nem description. */
    children?: ReactNode;
    ref?: Ref<HTMLButtonElement>;
}
