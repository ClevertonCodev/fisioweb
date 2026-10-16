import type { ReactNode, Ref, TextareaHTMLAttributes } from 'react';

export type TextareaState = 'default' | 'success' | 'error';

export interface TextareaProps extends Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    'value' | 'readOnly' | 'maxLength'
> {
    /** Valor controlado (no Vue: modelValue). */
    value?: string;
    onValueChange?: (value: string) => void;
    label?: string;
    helper?: ReactNode;
    placeholder?: string;
    state?: TextareaState;
    disabled?: boolean;
    readonly?: boolean;
    rows?: number;
    maxlength?: number;
    name?: string;
    id?: string;
    ref?: Ref<HTMLTextAreaElement>;
}
