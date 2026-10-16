import type { HTMLAttributes, ReactNode } from 'react';

import { dsCn } from '../utils/ds-cn';

export type CardVariant =
    | 'default'
    | 'outlined'
    | 'elevated'
    | 'brand'
    | 'interactive';

export interface CardProps extends Omit<
    HTMLAttributes<HTMLDivElement>,
    'title'
> {
    variant?: CardVariant;
    compact?: boolean;
    horizontal?: boolean;
    /** Slot `media` do Vue (imagem no topo ou à esquerda). */
    media?: ReactNode;
    /** Slot `header` do Vue (h3 e p ganham o estilo de título e subtítulo). */
    header?: ReactNode;
    /** Slot `corner` do Vue (ações no canto do cabeçalho). */
    corner?: ReactNode;
    footer?: ReactNode;
    children?: ReactNode;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
    default: '',
    outlined: 'shadow-none',
    elevated: 'shadow-ds-md',
    brand: 'border-ds-border-brand-subtle bg-ds-surface-brand-subtle',
    interactive:
        'cursor-pointer transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-ds-primary-40 hover:shadow-ds-md focus-visible:shadow-ds-focus focus-visible:outline-0 active:translate-y-0 active:shadow-ds-sm ds-dark:hover:border-ds-primary-60',
};

export function DsCard({
    variant = 'default',
    compact = false,
    horizontal = false,
    media,
    header,
    corner,
    footer,
    className,
    children,
    ...rest
}: CardProps) {
    return (
        <div
            {...rest}
            data-variant={variant}
            data-compact={compact || undefined}
            data-horizontal={horizontal || undefined}
            className={dsCn(
                'relative flex min-w-0 flex-col overflow-hidden rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default font-ds shadow-ds-sm',
                VARIANT_CLASSES[variant],
                horizontal && 'flex-row items-stretch',
                className,
            )}
        >
            {media && (
                <div
                    data-slot="media"
                    className={dsCn(
                        'h-[220px] w-full shrink-0 overflow-hidden bg-ds-surface-subtle [&_img]:block [&_img]:size-full [&_img]:object-cover [&_img]:object-center',
                        horizontal &&
                            'h-auto w-[200px] self-stretch rounded-l-ds-lg',
                    )}
                >
                    {media}
                </div>
            )}

            <div
                className={dsCn(
                    'flex min-w-0 flex-1 flex-col gap-4 p-5',
                    compact && 'gap-3 p-3.5',
                    horizontal && 'gap-3',
                )}
            >
                {(header || corner) && (
                    <div
                        data-slot="header"
                        className="flex flex-wrap items-start justify-between gap-3"
                    >
                        <div className="min-w-0 flex-1 [&_.ds-card-subtitle]:mt-0.5 [&_.ds-card-subtitle]:text-ds-caption [&_.ds-card-subtitle]:text-ds-content-muted [&_.ds-card-title]:m-0 [&_.ds-card-title]:text-ds-body-sm [&_.ds-card-title]:leading-[var(--ds-line-height-heading)] [&_.ds-card-title]:font-semibold [&_.ds-card-title]:text-ds-content-primary [&_h3]:m-0 [&_h3]:text-ds-body-sm [&_h3]:leading-[var(--ds-line-height-heading)] [&_h3]:font-semibold [&_h3]:text-ds-content-primary [&_p]:mt-0.5 [&_p]:text-ds-caption [&_p]:text-ds-content-muted">
                            {header}
                        </div>
                        {corner && (
                            <div className="flex shrink-0 flex-wrap items-center gap-2">
                                {corner}
                            </div>
                        )}
                    </div>
                )}

                {children && (
                    <div className="min-w-0 text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-content-muted">
                        {children}
                    </div>
                )}

                {footer && (
                    <div
                        data-slot="footer"
                        className={dsCn(
                            'flex flex-wrap items-center gap-2.5 border-t border-ds-border-subtle pt-4',
                            variant === 'brand' &&
                                'border-ds-border-brand-subtle',
                        )}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
