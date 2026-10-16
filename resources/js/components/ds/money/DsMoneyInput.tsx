import type { ChangeEvent } from 'react';
import { useId, useState } from 'react';

import {
    describedBy,
    DsFieldControl,
    DsFieldHelper,
    DsFieldLabel,
    fieldHelperId,
    fieldInputClass,
    fieldShellVariants,
} from '../field/field';
import { dsCn } from '../utils/ds-cn';

import { applyMoneyEdit, formatMoney } from './money-format';
import type { MoneyInputProps } from './types';

export function DsMoneyInput({
    value,
    defaultValue = null,
    onValueChange,
    currency = 'BRL',
    label = '',
    helper = '',
    placeholder = '',
    state = 'default',
    size = 'md',
    disabled = false,
    readonly = false,
    name = '',
    id,
    autocomplete = 'off',
    maxDigits,
    className,
    ref,
    ...rest
}: MoneyInputProps) {
    const generatedId = useId();
    const uid = id ?? generatedId;
    const helperId = fieldHelperId(uid);
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
    const isControlled = value !== undefined;
    const current = isControlled ? value : uncontrolledValue;

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const next = applyMoneyEdit(
            formatMoney(current, currency),
            event.target.value,
            currency,
            maxDigits,
            (event.nativeEvent as InputEvent).inputType,
        );
        if (!isControlled) setUncontrolledValue(next);
        onValueChange?.(next);
    }

    return (
        <DsFieldControl state={state} className={className}>
            {label && (
                <DsFieldLabel htmlFor={uid} disabled={disabled}>
                    {label}
                </DsFieldLabel>
            )}

            <div className={fieldShellVariants({ state, size })}>
                <input
                    {...rest}
                    ref={ref}
                    id={uid}
                    type="text"
                    inputMode="decimal"
                    name={name}
                    value={formatMoney(current, currency)}
                    placeholder={placeholder}
                    disabled={disabled}
                    readOnly={readonly}
                    autoComplete={autocomplete}
                    aria-invalid={state === 'error' || undefined}
                    aria-describedby={describedBy(
                        helper ? helperId : undefined,
                        rest['aria-describedby'],
                    )}
                    onChange={handleChange}
                    className={dsCn(
                        fieldInputClass,
                        'w-full',
                        size === 'sm' && 'text-ds-caption',
                    )}
                />
            </div>

            {helper && (
                <DsFieldHelper id={helperId} state={state}>
                    {helper}
                </DsFieldHelper>
            )}
        </DsFieldControl>
    );
}
