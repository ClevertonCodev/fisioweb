import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'destructive'
    | 'destructive-secondary'
    | 'destructive-tertiary';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'full';
export type ButtonIconPosition = 'left' | 'right' | 'only';
export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonTooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface ButtonProps extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'type' | 'children'
> {
    label?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    iconPosition?: ButtonIconPosition;
    /** Ícone (ex.: <Plus /> do lucide). Equivale ao slot `icon`. */
    icon?: ReactNode;
    disabled?: boolean;
    loading?: boolean;
    type?: ButtonType;
    /** Texto do tooltip (só ícone). Quando omitido, usa o `label`. */
    tooltip?: string;
    /** Posição do tooltip do botão só ícone. */
    tooltipPlacement?: ButtonTooltipPlacement;
    ref?: Ref<HTMLButtonElement>;
}
