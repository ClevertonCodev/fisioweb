import { ChevronDown } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useId } from 'react';

import {
    describedBy,
    DsFieldControl,
    DsFieldHelper,
    DsFieldLabel,
    fieldHelperId,
    fieldShellVariants,
} from '../field/field';
import { dsCn } from '../utils/ds-cn';

import type { SelectProps } from './types';

/** Select nativo do DS: funciona com register e aceita multiple. */
export function DsSelect({
    value,
    defaultValue,
    onValueChange,
    options,
    label,
    helper,
    placeholder = 'Selecione...',
    state = 'default',
    size = 'md',
    disabled = false,
    multiple = false,
    name,
    id,
    onChange,
    className,
    ref,
    ...rest
}: SelectProps) {
    const generatedId = useId();
    const uid = id ?? generatedId;
    const helperId = fieldHelperId(uid);
    const toNative = (v: SelectProps['value']) =>
        v === undefined
            ? undefined
            : Array.isArray(v)
              ? v.map(String)
              : String(v);
    // Sem valor nenhum, o placeholder fica selecionado.
    const nativeDefault =
        value === undefined && defaultValue === undefined && !multiple
            ? ''
            : toNative(defaultValue);

    function handleChange(event: ChangeEvent<HTMLSelectElement>) {
        onChange?.(event);
        onValueChange?.(
            multiple
                ? Array.from(event.target.selectedOptions).map((o) => o.value)
                : event.target.value,
        );
    }

    return (
        <DsFieldControl state={state} className={className}>
            {label && (
                <DsFieldLabel htmlFor={uid} disabled={disabled}>
                    {label}
                </DsFieldLabel>
            )}

            <div
                className={dsCn(
                    fieldShellVariants({ state }),
                    'relative gap-0 p-0',
                    'has-[select:focus]:border-ds-primary-80 has-[select:focus]:shadow-ds-focus ds-dark:has-[select:focus]:border-ds-primary-60',
                    'has-[select:disabled]:cursor-not-allowed has-[select:disabled]:bg-ds-surface-disabled',
                    state === 'error' &&
                        'has-[select:focus]:shadow-ds-focus-danger',
                )}
            >
                <select
                    {...rest}
                    ref={ref}
                    id={uid}
                    name={name}
                    disabled={disabled}
                    multiple={multiple}
                    value={toNative(value)}
                    defaultValue={
                        value === undefined ? nativeDefault : undefined
                    }
                    data-size={size}
                    aria-invalid={state === 'error' || undefined}
                    aria-describedby={describedBy(
                        helper ? helperId : undefined,
                        rest['aria-describedby'],
                    )}
                    onChange={handleChange}
                    className={dsCn(
                        'w-full min-w-0 flex-1 cursor-pointer appearance-none border-none bg-transparent font-ds text-ds-body-xs text-ds-content-primary outline-none ds-dark:[color-scheme:dark]',
                        'disabled:cursor-not-allowed disabled:text-ds-content-subtle',
                        size === 'sm'
                            ? 'py-2 pr-8 pl-3 text-ds-caption'
                            : 'py-3 pr-8 pl-4',
                        multiple && 'min-h-[100px] px-4 py-2',
                    )}
                >
                    {!multiple && placeholder && (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    )}
                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                {!multiple && (
                    <ChevronDown
                        aria-hidden="true"
                        className="pointer-events-none absolute right-4 size-[18px] text-ds-content-subtle"
                    />
                )}
            </div>

            {helper && (
                <DsFieldHelper id={helperId} state={state}>
                    {helper}
                </DsFieldHelper>
            )}
        </DsFieldControl>
    );
}
