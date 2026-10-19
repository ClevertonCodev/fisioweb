import { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

import { ClinicTopbar } from './ClinicTopbar';

interface ClinicLayoutProps {
    children: ReactNode;
    /** Trava o scroll no main para a tela filha controlar altura e rodapé fixo. */
    fillViewport?: boolean;
}

export function ClinicLayout({ children, fillViewport }: ClinicLayoutProps) {
    return (
        <TooltipProvider>
            <div className="flex h-screen w-full flex-col bg-background font-ds">
                <ClinicTopbar />
                <main
                    className={
                        fillViewport
                            ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                            : 'min-h-0 flex-1 overflow-auto'
                    }
                >
                    {children}
                </main>
            </div>
        </TooltipProvider>
    );
}
