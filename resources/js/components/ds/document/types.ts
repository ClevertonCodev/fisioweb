import type { InputHTMLAttributes, Ref } from 'react';

/** Props comuns de DsCpfField, DsCnpjField, DsRgField, DsCnhField e DsPassportField. */
export interface DocumentFieldProps extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'type' | 'inputMode' | 'autoComplete'
> {
    /** Valor com máscara (no Vue: modelValue). */
    value?: string;
    /** Valor com máscara a cada digitação (no Vue: update:modelValue). */
    onValueChange?: (value: string) => void;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    /** Mensagem mostrada só quando `invalid`. */
    helperText?: string;
    placeholder?: string;
    ref?: Ref<HTMLInputElement>;
}

export type CpfFieldProps = DocumentFieldProps;
export type CnpjFieldProps = DocumentFieldProps;
export type RgFieldProps = DocumentFieldProps;
export type CnhFieldProps = DocumentFieldProps;
export type PassportFieldProps = DocumentFieldProps;
