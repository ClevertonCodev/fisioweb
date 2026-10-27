import { cva } from 'class-variance-authority';
import type { HTMLAttributes, ReactNode } from 'react';

import { dsCn } from '../utils/ds-cn';

export type BadgeVariant =
    | 'default'
    | 'primary'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'new';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    /** Ícone (ex.: <Star /> do lucide). Escondido quando `dot`. */
    icon?: ReactNode;
    dot?: boolean;
    children?: ReactNode;
}

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-ds-pill px-2.5 py-0.5 font-ds text-[0.75rem] leading-[1.5] font-medium whitespace-nowrap [&_svg]:size-[13px] [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-ds-surface-subtle text-ds-content-primary',
                primary:
                    'bg-ds-primary-100/12 text-ds-primary-100 ds-dark:bg-ds-surface-brand-subtle ds-dark:text-ds-primary-40',
                info: 'bg-[var(--ds-color-info-surface)] text-[var(--ds-color-info-content)] ds-dark:bg-ds-status-info-surface ds-dark:text-ds-status-info-content',
                success:
                    'bg-[var(--ds-color-success-surface)] text-[var(--ds-color-success-content)] ds-dark:bg-ds-status-success-surface ds-dark:text-ds-status-success-content',
                warning:
                    'bg-[var(--ds-color-warning-surface)] text-[var(--ds-color-warning-content)] ds-dark:bg-ds-status-warning-surface ds-dark:text-ds-status-warning-content',
                danger: 'bg-[var(--ds-color-danger-surface)] text-[var(--ds-color-danger-content)] ds-dark:bg-ds-status-danger-surface ds-dark:text-ds-status-danger-content',
                new: 'bg-[image:var(--ds-gradient-brand)] text-ds-white',
            },
            dot: { true: 'px-2', false: '' },
        },
        defaultVariants: { variant: 'default', dot: false },
    },
);

export function DsBadge({
    variant = 'default',
    icon,
    dot = false,
    className,
    children,
    ...rest
}: BadgeProps) {
    return (
        <span
            {...rest}
            data-variant={variant}
            className={dsCn(badgeVariants({ variant, dot }), className)}
        >
            {dot && (
                <span
                    data-testid="ds-badge-dot"
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-current"
                />
            )}
            {icon && !dot && icon}
            {children}
        </span>
    );
}
