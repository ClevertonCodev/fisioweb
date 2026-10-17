import type { ReactNode } from 'react';

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left';

export interface TooltipProps {
    /** Texto (ou conteúdo rico) do balão. `null` desliga o tooltip. */
    content: ReactNode | null;
    placement?: TooltipPlacement;
    /** O gatilho. */
    children: ReactNode;
    /**
     * Usa o próprio filho como gatilho, sem o <span> em volta.
     * O filho precisa aceitar ref e repassar props (ex.: <button>).
     */
    asChild?: boolean;
}
