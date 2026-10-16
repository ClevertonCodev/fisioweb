import { Inbox, Lock, Search, WifiOff } from 'lucide-react';
import type { ReactNode } from 'react';

import { dsCn } from '../utils/ds-cn';

export type EmptyStateVariant =
    | 'empty'
    | 'no-results'
    | 'no-permission'
    | 'error';

export interface EmptyStateProps {
    variant?: EmptyStateVariant;
    title?: string;
    description?: string;
    icon?: ReactNode;
    /** Slot `action` do Vue. */
    action?: ReactNode;
    className?: string;
}

const DEFAULTS: Record<
    EmptyStateVariant,
    { icon: ReactNode; title: string; description: string }
> = {
    empty: {
        icon: <Inbox />,
        title: 'Nenhum item cadastrado',
        description: 'Adicione o primeiro item para começar.',
    },
    'no-results': {
        icon: <Search />,
        title: 'Nenhum resultado encontrado',
        description: 'Tente ajustar os filtros ou o termo de busca.',
    },
    'no-permission': {
        icon: <Lock />,
        title: 'Acesso restrito',
        description: 'Você não tem permissão para visualizar este conteúdo.',
    },
    error: {
        icon: <WifiOff />,
        title: 'Não foi possível carregar',
        description: 'Verifique sua conexão e tente novamente.',
    },
};

export function DsEmptyState({
    variant = 'empty',
    title,
    description,
    icon,
    action,
    className,
}: EmptyStateProps) {
    const defaults = DEFAULTS[variant];
    const neutral = variant === 'no-results' || variant === 'no-permission';

    return (
        <div
            data-variant={variant}
            className={dsCn(
                'flex flex-col items-center gap-2 px-6 py-12 text-center font-ds',
                className,
            )}
        >
            <span
                aria-hidden="true"
                className={dsCn(
                    'mb-2 grid size-12 place-items-center rounded-full bg-ds-surface-brand-subtle text-ds-primary-80 [&_svg]:size-6',
                    variant === 'error' && 'bg-ds-danger-10 text-ds-danger-80',
                    neutral && 'bg-ds-gray-50/12 text-ds-gray-50',
                )}
            >
                {icon ?? defaults.icon}
            </span>

            <p className="m-0 text-ds-body-sm leading-[var(--ds-line-height-heading)] font-semibold text-ds-content-secondary">
                {title ?? defaults.title}
            </p>
            <p className="m-0 max-w-[42ch] text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-content-muted">
                {description ?? defaults.description}
            </p>

            {action && (
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {action}
                </div>
            )}
        </div>
    );
}
