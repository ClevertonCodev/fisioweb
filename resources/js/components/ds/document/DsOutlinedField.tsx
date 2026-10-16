import type { ReactNode } from 'react';

import { dsCn } from '../utils/ds-cn';

/**
 * Moldura com o rótulo sobre a borda (document-field.scss do Vue), usada pelos
 * campos de documento e pelo DsPhoneField.
 */
export function DsOutlinedField({
    inputId,
    label,
    required,
    disabled,
    invalid,
    helperId,
    helperText,
    className,
    children,
}: {
    inputId: string;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    helperId?: string;
    helperText?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            data-compact={!label || undefined}
            className={dsCn('flex w-full flex-col gap-1 font-ds', className)}
        >
            <div
                className={dsCn(
                    'relative flex flex-col rounded-ds-md border border-ds-border-subtle bg-ds-surface-default',
                    'transition-[border-color,box-shadow,background-color] duration-150',
                    'focus-within:border-ds-primary-80 focus-within:shadow-ds-focus hover:border-ds-border-strong',
                    label ? 'px-3 pt-3.5 pb-2' : 'px-4 py-3',
                    invalid &&
                        'border-ds-status-danger-border focus-within:border-ds-status-danger-border focus-within:shadow-ds-focus-danger hover:border-ds-status-danger-border',
                    disabled &&
                        'cursor-not-allowed border-ds-border-subtle bg-ds-surface-disabled hover:border-ds-border-subtle',
                )}
            >
                {label && (
                    <div
                        className={dsCn(
                            'absolute top-0 left-[11px] z-[1] inline-flex max-w-[calc(100%-22px)] min-w-0 -translate-y-1/2 items-center gap-0.5 bg-ds-surface-default px-1',
                            disabled && 'bg-ds-surface-disabled',
                        )}
                    >
                        <label
                            htmlFor={inputId}
                            className={dsCn(
                                'min-w-0 truncate text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-content-primary',
                                invalid && 'text-ds-status-danger-content',
                                disabled && 'text-ds-content-subtle',
                            )}
                        >
                            {label}
                        </label>
                        {required && (
                            <span
                                aria-hidden="true"
                                className={dsCn(
                                    'text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-status-danger-content',
                                    disabled && 'text-ds-content-subtle',
                                )}
                            >
                                *
                            </span>
                        )}
                    </div>
                )}

                {children}
            </div>

            {invalid && helperText && (
                <div className="flex min-h-[23px] items-start">
                    <span
                        id={helperId}
                        className="text-ds-caption leading-[var(--ds-line-height-base)] text-ds-status-danger-content"
                    >
                        {helperText}
                    </span>
                </div>
            )}
        </div>
    );
}

/** Classe do <input> sem moldura dentro do DsOutlinedField. */
export const outlinedInputClass =
    'w-full min-w-0 border-none bg-transparent p-0 font-[inherit] text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-content-primary outline-none placeholder:text-ds-content-subtle disabled:cursor-not-allowed disabled:text-ds-content-subtle';
