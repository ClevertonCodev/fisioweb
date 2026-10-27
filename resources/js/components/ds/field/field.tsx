import { cva } from 'class-variance-authority';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { dsCn } from '../utils/ds-cn';

export type FieldState = 'default' | 'success' | 'error';
export type FieldSize = 'md' | 'sm';

/** Coluna rótulo + campo + helper. */
export function DsFieldControl({
    state = 'default',
    className,
    children,
}: {
    state?: FieldState;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            data-state={state}
            className={dsCn('flex w-full flex-col gap-1 font-ds', className)}
        >
            {children}
        </div>
    );
}

export function DsFieldLabel({
    htmlFor,
    disabled,
    required,
    children,
}: {
    htmlFor: string;
    disabled?: boolean;
    /** Asterisco vermelho, como no DsOutlinedField. */
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <label
            htmlFor={htmlFor}
            className={dsCn(
                'cursor-pointer text-ds-body-xs font-medium text-ds-content-primary',
                disabled && 'text-ds-content-subtle',
            )}
        >
            {children}
            {required && (
                <span
                    aria-hidden="true"
                    className={dsCn(
                        'ml-0.5 text-ds-status-danger-content',
                        disabled && 'text-ds-content-subtle',
                    )}
                >
                    *
                </span>
            )}
        </label>
    );
}

export function DsFieldHelper({
    id,
    state = 'default',
    children,
}: {
    id: string;
    state?: FieldState;
    children: ReactNode;
}) {
    return (
        <span
            id={id}
            className={dsCn(
                'text-ds-caption leading-[var(--ds-line-height-base)] text-ds-content-muted',
                state === 'success' && 'text-ds-status-success-content',
                state === 'error' && 'text-ds-status-danger-content',
            )}
        >
            {children}
        </span>
    );
}

/** Moldura do campo (.ds-field): borda, fundo, foco e estados. */
export const fieldShellVariants = cva(
    [
        'flex items-center gap-2 rounded-ds-md border border-ds-border-subtle bg-ds-surface-default',
        'transition-[border-color,box-shadow] duration-150',
        'has-[input:focus,textarea:focus,button:focus-visible]:border-ds-primary-80 has-[input:focus,textarea:focus,button:focus-visible]:shadow-ds-focus',
        'ds-dark:has-[input:focus,textarea:focus,button:focus-visible]:border-ds-primary-60',
        'has-[input:disabled,button:disabled]:cursor-not-allowed has-[input:disabled,button:disabled]:border-ds-border-subtle has-[input:disabled,button:disabled]:bg-ds-surface-disabled',
        '[&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-ds-content-subtle',
    ],
    {
        variants: {
            state: {
                default: '',
                success:
                    'border-ds-status-success-border bg-ds-status-success-surface',
                error: 'border-ds-status-danger-border has-[input:focus,textarea:focus,button:focus-visible]:shadow-ds-focus-danger',
            },
            size: {
                md: 'px-4 py-3',
                sm: 'px-3 py-2 text-ds-caption',
            },
        },
        defaultVariants: { state: 'default', size: 'md' },
    },
);

/** O <input> sem moldura dentro do .ds-field. */
export const fieldInputClass = [
    'min-w-0 flex-1 border-none bg-transparent font-ds text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-content-primary outline-none',
    'placeholder:text-ds-content-subtle disabled:cursor-not-allowed disabled:text-ds-content-subtle',
    '[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden',
].join(' ');

/** Botão de ícone dentro do campo (limpar, mostrar senha). */
export const fieldIconButtonClass =
    'flex cursor-pointer items-center border-none bg-transparent p-0.5 text-ds-content-subtle hover:text-ds-content-primary focus-visible:rounded-ds-xs focus-visible:shadow-ds-focus focus-visible:outline-none [&_svg]:size-[18px]';

/** Ícone de validação (success/error) à direita do campo. */
export function DsFieldStateIcon({ state }: { state: FieldState }) {
    if (state === 'success') {
        return (
            <CheckCircle2
                data-testid="ds-state-icon-success"
                aria-hidden="true"
                className="!text-ds-status-success-content"
            />
        );
    }
    if (state === 'error') {
        return (
            <CircleAlert
                data-testid="ds-state-icon-error"
                aria-hidden="true"
                className="!text-ds-status-danger-content"
            />
        );
    }
    return null;
}

/** Id do helper derivado do id do campo. */
export function fieldHelperId(id: string) {
    return `${id}-helper`;
}

/** Junta ids de aria-describedby, ignorando os vazios. */
export function describedBy(...ids: Array<string | undefined>) {
    return ids.filter(Boolean).join(' ') || undefined;
}
