import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

/**
 * StatusBadge — badge padronizado do sistema, estilo outlined.
 *
 * Variantes (mesma paleta de Pacientes e evoluções):
 * - active  → teal/primary  (Ativo, Fácil, Em tratamento, Alta, Concluído)
 * - warning → amber         (Médio, Em prevenção, Processando)
 * - danger  → rose          (Difícil, Falhou)
 * - neutral → cinza         (Inativo, Pendente, Cancelado)
 */
const statusBadgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
    {
        variants: {
            variant: {
                active: 'border-primary/30 bg-primary/10 text-primary',
                warning: 'border-amber-200 bg-amber-50 text-amber-600',
                danger: 'border-rose-200 bg-rose-50 text-rose-600',
                neutral: 'border-border bg-transparent text-muted-foreground',
                /** verde — Alta, Concluído */
                success: 'border-emerald-200 bg-emerald-50 text-emerald-600',
                /** azul bebê — Em tratamento */
                info: 'border-sky-200 bg-sky-50 text-sky-600',
            },
        },
        defaultVariants: {
            variant: 'neutral',
        },
    },
);

export interface StatusBadgeProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof statusBadgeVariants> {}

export function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
    return <div className={cn(statusBadgeVariants({ variant }), className)} {...props} />;
}
