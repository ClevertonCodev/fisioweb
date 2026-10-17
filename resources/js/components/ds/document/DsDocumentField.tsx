import type { ChangeEvent } from 'react';
import { useId } from 'react';

import { maskedCaret } from './brazilian-document';
import { DsOutlinedField, outlinedInputClass } from './DsOutlinedField';
import type { DocumentFieldProps } from './types';

interface DsDocumentFieldProps extends DocumentFieldProps {
    format: (value: string) => string;
    inputMode: 'numeric' | 'text';
    autoCapitalize?: string;
}

/**
 * Base dos campos de documento: rótulo sobre a borda, máscara aplicada ao
 * digitar e ao colar, cursor preservado.
 */
export function DsDocumentField({
    format,
    inputMode,
    autoCapitalize,
    value,
    onValueChange,
    label = '',
    required = false,
    disabled = false,
    invalid = false,
    helperText = '',
    placeholder,
    id,
    onChange,
    className,
    ref,
    ...rest
}: DsDocumentFieldProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const input = event.target;
        const raw = input.value;
        const caret = input.selectionStart ?? raw.length;
        const masked = format(raw);

        // Reescreve o valor no próprio input antes de avisar: assim o onChange do
        // register (RHF) já lê o valor mascarado e o cursor não pula para o fim.
        if (masked !== raw) {
            input.value = masked;
            const position = maskedCaret(raw, caret, masked);
            input.setSelectionRange(position, position);
        }

        onChange?.(event);
        onValueChange?.(masked);
    }

    return (
        <DsOutlinedField
            inputId={inputId}
            label={label}
            required={required}
            disabled={disabled}
            invalid={invalid}
            helperId={helperId}
            helperText={helperText}
            className={className}
        >
            <input
                {...rest}
                ref={ref}
                id={inputId}
                type="text"
                inputMode={inputMode}
                autoCapitalize={autoCapitalize}
                autoComplete="off"
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                aria-invalid={invalid ? 'true' : 'false'}
                aria-describedby={invalid ? helperId : undefined}
                onChange={handleChange}
                className={outlinedInputClass}
            />
        </DsOutlinedField>
    );
}
