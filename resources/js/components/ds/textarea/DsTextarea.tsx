import type { ChangeEvent } from 'react';
import { useId, useMemo, useRef } from 'react';

import {
    describedBy,
    DsFieldControl,
    DsFieldHelper,
    DsFieldLabel,
    fieldHelperId,
} from '../field/field';
import { useNativeValue } from '../input/use-native-value';
import { dsCn } from '../utils/ds-cn';
import { mergeRefs } from '../utils/refs';

import type { TextareaProps } from './types';

export function DsTextarea({
    value,
    onValueChange,
    label,
    helper,
    placeholder = '',
    state = 'default',
    disabled = false,
    readonly = false,
    rows = 4,
    maxlength,
    name,
    id,
    onChange,
    className,
    ref,
    ...rest
}: TextareaProps) {
    const generatedId = useId();
    const uid = id ?? generatedId;
    const helperId = fieldHelperId(uid);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mergedRef = useMemo(() => mergeRefs(ref, textareaRef), [ref]);
    // Sem `value`, lê do próprio elemento: o register do RHF escreve no DOM.
    const [currentValue, setUncontrolledValue] = useNativeValue(
        textareaRef,
        value,
        rest.defaultValue?.toString() ?? '',
    );
    const length = currentValue.length;

    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
        setUncontrolledValue(event.target.value);
        onChange?.(event);
        onValueChange?.(event.target.value);
    }

    return (
        <DsFieldControl state={state} className={className}>
            {label && (
                <DsFieldLabel htmlFor={uid} disabled={disabled}>
                    {label}
                </DsFieldLabel>
            )}

            <textarea
                {...rest}
                ref={mergedRef}
                id={uid}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readonly}
                rows={rows}
                maxLength={maxlength}
                name={name}
                data-state={state}
                aria-invalid={state === 'error' || undefined}
                aria-describedby={describedBy(
                    helper ? helperId : undefined,
                    rest['aria-describedby'],
                )}
                onChange={handleChange}
                className={dsCn(
                    'box-border min-h-[132px] w-full resize-y rounded-ds-md border border-ds-border-subtle bg-ds-surface-default px-4 py-3',
                    'font-ds text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-content-primary outline-none',
                    'transition-[border-color,box-shadow] duration-150 placeholder:text-ds-content-subtle',
                    'focus:border-ds-primary-80 focus:shadow-ds-focus ds-dark:focus:border-ds-primary-60',
                    'disabled:cursor-not-allowed disabled:resize-none disabled:border-ds-border-subtle disabled:bg-ds-surface-disabled disabled:text-ds-content-subtle',
                    state === 'success' &&
                        'border-ds-status-success-border bg-ds-status-success-surface',
                    state === 'error' &&
                        'border-ds-status-danger-border focus:shadow-ds-focus-danger',
                )}
            />

            {(helper || !!maxlength) && (
                <div className="flex items-center justify-between">
                    {helper ? (
                        <DsFieldHelper id={helperId} state={state}>
                            {helper}
                        </DsFieldHelper>
                    ) : (
                        <span />
                    )}
                    {!!maxlength && (
                        <span className="font-ds-mono text-ds-caption text-ds-content-subtle">
                            {`${length} / ${maxlength}`}
                        </span>
                    )}
                </div>
            )}
        </DsFieldControl>
    );
}
