import { Eye, EyeOff, X } from 'lucide-react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useId, useMemo, useRef, useState } from 'react';

import {
    describedBy,
    DsFieldControl,
    DsFieldHelper,
    DsFieldLabel,
    DsFieldStateIcon,
    fieldHelperId,
    fieldIconButtonClass,
    fieldInputClass,
    fieldShellVariants,
} from '../field/field';
import { dsCn } from '../utils/ds-cn';
import { mergeRefs, setNativeInputValue } from '../utils/refs';

import type { InputProps } from './types';
import { useNativeValue } from './use-native-value';

export function DsInput({
    value,
    onValueChange,
    label,
    helper,
    placeholder = '',
    type = 'text',
    state = 'default',
    size = 'md',
    disabled = false,
    readonly = false,
    name,
    id,
    autocomplete,
    iconLeft,
    iconRight,
    onEnterPressed,
    onCleared,
    onChange,
    onKeyDown,
    className,
    ref,
    ...rest
}: InputProps) {
    const generatedId = useId();
    const uid = id ?? generatedId;
    const helperId = fieldHelperId(uid);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showPassword, setShowPassword] = useState(false);
    // Sem `value`, lê do próprio elemento: o register do RHF escreve no DOM.
    const [currentValue, setUncontrolledValue] = useNativeValue(
        inputRef,
        value,
        rest.defaultValue?.toString() ?? '',
    );
    const mergedRef = useMemo(() => mergeRefs(ref, inputRef), [ref]);

    const inputType =
        type === 'password' ? (showPassword ? 'text' : 'password') : type;
    const showClear =
        type === 'search' && currentValue !== '' && !disabled && !readonly;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        setUncontrolledValue(event.target.value);
        onChange?.(event);
        onValueChange?.(event.target.value);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        onKeyDown?.(event);
        if (event.key === 'Enter') onEnterPressed?.();
    }

    function clearSearch() {
        if (inputRef.current) setNativeInputValue(inputRef.current, '');
        onCleared?.();
        inputRef.current?.focus();
    }

    return (
        <DsFieldControl state={state} className={className}>
            {label && (
                <DsFieldLabel htmlFor={uid} disabled={disabled}>
                    {label}
                </DsFieldLabel>
            )}

            <div className={fieldShellVariants({ state, size })}>
                {iconLeft}

                <input
                    {...rest}
                    ref={mergedRef}
                    id={uid}
                    type={inputType}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readonly}
                    name={name}
                    autoComplete={autocomplete}
                    aria-invalid={state === 'error' || undefined}
                    aria-describedby={describedBy(
                        helper ? helperId : undefined,
                        rest['aria-describedby'],
                    )}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    className={dsCn(
                        fieldInputClass,
                        size === 'sm' && 'text-ds-caption',
                    )}
                />

                {type !== 'password' && <DsFieldStateIcon state={state} />}

                {showClear && (
                    <button
                        type="button"
                        aria-label="Limpar busca"
                        className={fieldIconButtonClass}
                        onClick={clearSearch}
                    >
                        <X aria-hidden="true" />
                    </button>
                )}

                {type === 'password' && (
                    <button
                        type="button"
                        aria-label={
                            showPassword ? 'Ocultar senha' : 'Mostrar senha'
                        }
                        className={fieldIconButtonClass}
                        onClick={() => setShowPassword((shown) => !shown)}
                    >
                        {showPassword ? (
                            <EyeOff aria-hidden="true" />
                        ) : (
                            <Eye aria-hidden="true" />
                        )}
                    </button>
                )}

                {iconRight}
            </div>

            {helper && (
                <DsFieldHelper id={helperId} state={state}>
                    {helper}
                </DsFieldHelper>
            )}
        </DsFieldControl>
    );
}
