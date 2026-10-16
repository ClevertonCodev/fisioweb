import { cva } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import type { MouseEvent } from 'react';

import { DsTooltip } from '../tooltip/DsTooltip';
import { dsCn } from '../utils/ds-cn';

import type { ButtonProps } from './types';

const buttonVariants = cva(
    [
        'inline-flex items-center justify-center gap-2 rounded-ds-md border border-transparent',
        'font-ds text-ds-body-xs leading-none font-medium whitespace-nowrap no-underline select-none',
        'cursor-pointer outline-none transition-[background-color,color,border-color] duration-150',
        'focus-visible:shadow-ds-focus [&_svg]:size-[1em] [&_svg]:shrink-0',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-ds-border-subtle disabled:bg-ds-surface-disabled disabled:text-ds-content-subtle',
    ],
    {
        variants: {
            variant: {
                primary: [
                    'bg-ds-primary-80 text-ds-primary-10 enabled:hover:bg-ds-primary-100 enabled:active:bg-ds-primary-120',
                    // Dark: a marca continua de fundo (branco 5.9:1) e o hover clareia
                    // para primary-70 (branco 4.6:1), como na paleta fisioweb.
                    'ds-dark:bg-ds-primary-80 ds-dark:enabled:hover:bg-ds-primary-70 ds-dark:enabled:active:bg-ds-primary-100',
                ],
                secondary: [
                    'border-ds-primary-80 bg-transparent text-ds-primary-80',
                    'enabled:hover:border-ds-primary-100 enabled:hover:bg-ds-surface-brand-subtle enabled:hover:text-ds-primary-100',
                    'enabled:active:border-ds-primary-120 enabled:active:bg-ds-primary-20 enabled:active:text-ds-primary-120',
                    'disabled:bg-transparent',
                    'ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-60',
                    'ds-dark:enabled:hover:border-ds-primary-40 ds-dark:enabled:hover:text-ds-primary-40',
                    'ds-dark:enabled:active:border-ds-primary-40 ds-dark:enabled:active:bg-ds-surface-brand-subtle ds-dark:enabled:active:text-ds-primary-40',
                ],
                tertiary: [
                    'border-transparent bg-transparent text-ds-primary-80',
                    'enabled:hover:bg-ds-surface-brand-subtle enabled:hover:text-ds-primary-100',
                    'enabled:active:bg-ds-primary-20 enabled:active:text-ds-primary-120',
                    'disabled:bg-transparent',
                    'ds-dark:text-ds-primary-60 ds-dark:enabled:hover:text-ds-primary-40',
                    'ds-dark:enabled:active:bg-ds-surface-brand-subtle ds-dark:enabled:active:text-ds-primary-40',
                ],
                destructive: [
                    'border-ds-danger-80 bg-ds-danger-80 text-ds-white',
                    'enabled:hover:border-ds-danger-100 enabled:hover:bg-ds-danger-100',
                    'enabled:active:border-ds-danger-120 enabled:active:bg-ds-danger-120',
                ],
                'destructive-secondary': [
                    'border-ds-danger-80 bg-transparent text-ds-danger-80',
                    'enabled:hover:border-ds-danger-100 enabled:hover:bg-ds-danger-10 enabled:hover:text-ds-danger-100',
                    'enabled:active:border-ds-danger-120 enabled:active:bg-ds-danger-10 enabled:active:text-ds-danger-120',
                    'disabled:bg-transparent',
                    'ds-dark:enabled:hover:border-ds-status-danger-border ds-dark:enabled:hover:bg-ds-status-danger-surface ds-dark:enabled:hover:text-ds-status-danger-content',
                    'ds-dark:enabled:active:border-ds-status-danger-border ds-dark:enabled:active:bg-ds-status-danger-surface ds-dark:enabled:active:text-ds-status-danger-content',
                ],
                'destructive-tertiary': [
                    'border-transparent bg-transparent text-ds-danger-80',
                    'enabled:hover:bg-ds-danger-10 enabled:hover:text-ds-danger-100',
                    'enabled:active:bg-ds-danger-10 enabled:active:text-ds-danger-120',
                    'disabled:bg-transparent',
                    'ds-dark:enabled:hover:border-ds-status-danger-border ds-dark:enabled:hover:bg-ds-status-danger-surface ds-dark:enabled:hover:text-ds-status-danger-content',
                    'ds-dark:enabled:active:border-ds-status-danger-border ds-dark:enabled:active:bg-ds-status-danger-surface ds-dark:enabled:active:text-ds-status-danger-content',
                ],
            },
            size: {
                sm: 'px-3 py-2 text-ds-caption',
                md: 'px-4 py-3',
                lg: 'px-6 py-4',
                full: 'w-full p-4',
            },
            iconOnly: {
                true: '',
                false: '',
            },
        },
        compoundVariants: [
            // Só ícone: área mínima de toque quadrada.
            { iconOnly: true, size: 'sm', className: 'p-2' },
            { iconOnly: true, size: 'md', className: 'p-3' },
            { iconOnly: true, size: 'lg', className: 'p-4' },
        ],
        defaultVariants: {
            variant: 'primary',
            size: 'md',
            iconOnly: false,
        },
    },
);

export function DsButton({
    label = 'Botão',
    variant = 'primary',
    size = 'md',
    iconPosition,
    icon,
    disabled = false,
    loading = false,
    type = 'button',
    tooltip,
    tooltipPlacement = 'top',
    className,
    onClick,
    ref,
    ...rest
}: ButtonProps) {
    const isIconOnly = iconPosition === 'only';
    const spinner = (
        <LoaderCircle className="animate-spin" aria-hidden="true" />
    );
    // No Vue o slot do ícone gira durante o loading; aqui o spinner ocupa o lugar dele.
    const leadingIcon =
        iconPosition === 'left' || isIconOnly
            ? loading
                ? spinner
                : icon
            : null;

    function handleClick(event: MouseEvent<HTMLButtonElement>) {
        if (disabled || loading) return;
        onClick?.(event);
    }

    const button = (
        <button
            {...rest}
            ref={ref}
            type={type}
            disabled={disabled || loading}
            aria-label={isIconOnly ? label : rest['aria-label']}
            aria-busy={loading || undefined}
            data-variant={variant}
            data-size={size}
            data-icon-only={isIconOnly || undefined}
            data-loading={loading || undefined}
            onClick={handleClick}
            className={dsCn(
                buttonVariants({ variant, size, iconOnly: isIconOnly }),
                className,
            )}
        >
            {leadingIcon}
            {!isIconOnly && (
                <span className="inline-flex items-center gap-2">
                    {loading && iconPosition !== 'left' && spinner}
                    {label}
                </span>
            )}
            {iconPosition === 'right' && icon}
        </button>
    );

    if (!isIconOnly) return button;

    // Botão só de ícone sempre ganha tooltip reforçando a ação (texto = tooltip ?? label).
    return (
        <DsTooltip
            asChild
            content={tooltip ?? label}
            placement={tooltipPlacement}
        >
            {button}
        </DsTooltip>
    );
}
