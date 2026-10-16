import { Check, Info, TriangleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { dsCn } from '../utils/ds-cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
export type AlertMode = 'compact' | 'rich';

export interface AlertProps {
    variant?: AlertVariant;
    mode?: AlertMode;
    title?: string;
    time?: string;
    dismissible?: boolean;
    /** Ícone no lugar do padrão da variante. */
    icon?: ReactNode;
    /** Slot `actions` do Vue (só no modo rich). */
    actions?: ReactNode;
    onDismiss?: () => void;
    className?: string;
    /** Descrição (slot default do Vue). */
    children?: ReactNode;
}

const DEFAULT_ICONS: Record<AlertVariant, ReactNode> = {
    info: <Info />,
    success: <Check />,
    warning: <TriangleAlert />,
    danger: <TriangleAlert />,
};

// Cores por variante em variáveis locais, como no Vue (--ds-v2-alert-*).
// No dark, as variáveis passam para os tokens semânticos de status.
const VARIANT_VARS: Record<AlertVariant, string> = {
    info: '[--alert-surface:var(--ds-color-info-surface)] [--alert-border:var(--ds-color-info-border)] [--alert-content:var(--ds-color-info-content)] ds-dark:[--alert-surface:var(--ds-status-info-surface)] ds-dark:[--alert-border:var(--ds-status-info-border)] ds-dark:[--alert-content:var(--ds-status-info-content)]',
    success:
        '[--alert-surface:var(--ds-color-success-surface)] [--alert-border:var(--ds-color-success-border)] [--alert-content:var(--ds-color-success-content)] ds-dark:[--alert-surface:var(--ds-status-success-surface)] ds-dark:[--alert-border:var(--ds-status-success-border)] ds-dark:[--alert-content:var(--ds-status-success-content)]',
    warning:
        '[--alert-surface:var(--ds-color-warning-surface)] [--alert-border:var(--ds-color-warning-border)] [--alert-content:var(--ds-color-warning-content)] ds-dark:[--alert-surface:var(--ds-status-warning-surface)] ds-dark:[--alert-border:var(--ds-status-warning-border)] ds-dark:[--alert-content:var(--ds-status-warning-content)]',
    danger: '[--alert-surface:var(--ds-color-danger-surface)] [--alert-border:var(--ds-color-danger-border)] [--alert-content:var(--ds-color-danger-content)] ds-dark:[--alert-surface:var(--ds-status-danger-surface)] ds-dark:[--alert-border:var(--ds-status-danger-border)] ds-dark:[--alert-content:var(--ds-status-danger-content)]',
};

export function DsAlert({
    variant = 'info',
    mode = 'compact',
    title,
    time,
    dismissible = false,
    icon,
    actions,
    onDismiss,
    className,
    children,
}: AlertProps) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;

    const isRich = mode === 'rich';

    function dismiss() {
        setDismissed(true);
        onDismiss?.();
    }

    return (
        <article
            role="alert"
            data-variant={variant}
            data-mode={mode}
            className={dsCn(
                'grid grid-cols-[auto_minmax(0,1fr)_auto] gap-4 rounded-ds-lg border border-[var(--alert-border)] bg-ds-surface-default p-[18px] font-ds shadow-ds-sm',
                isRich ? 'items-start' : 'items-center',
                VARIANT_VARS[variant],
                className,
            )}
        >
            <div className="grid size-11 shrink-0 place-items-center rounded-ds-lg bg-[var(--alert-surface)] text-[var(--alert-content)] [&_svg]:size-[22px]">
                <span aria-hidden="true" className="contents">
                    {icon ?? DEFAULT_ICONS[variant]}
                </span>
            </div>

            <div className="min-w-0">
                {isRich && (title || time) && (
                    <div className="flex flex-wrap items-baseline gap-2.5">
                        {title && (
                            <span className="text-ds-body-sm leading-[var(--ds-line-height-heading)] font-medium text-ds-content-primary">
                                {title}
                            </span>
                        )}
                        {time && (
                            <span className="shrink-0 font-ds-mono text-ds-caption text-ds-content-subtle">
                                {time}
                            </span>
                        )}
                    </div>
                )}
                <div
                    className={dsCn(
                        isRich
                            ? 'mt-1 text-ds-body-xs leading-[1.5] text-ds-content-muted'
                            : 'text-ds-body-sm leading-[1.45] font-medium text-ds-content-primary',
                    )}
                >
                    {children}
                </div>
                {isRich && actions && (
                    <div className="mt-3.5 flex flex-wrap gap-2.5">
                        {actions}
                    </div>
                )}
            </div>

            {dismissible && (
                <button
                    type="button"
                    aria-label="Fechar alerta"
                    onClick={dismiss}
                    className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-ds-pill border-0 bg-transparent text-ds-content-muted transition-[background,color] duration-150 hover:bg-ds-surface-subtle hover:text-ds-content-primary focus-visible:shadow-ds-focus focus-visible:outline-none [&_svg]:size-5"
                >
                    <X aria-hidden="true" />
                </button>
            )}
        </article>
    );
}
