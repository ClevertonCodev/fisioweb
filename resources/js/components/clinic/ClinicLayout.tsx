import { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

import { ClinicSidebar } from './ClinicSidebar';

interface ClinicLayoutProps {
    children: ReactNode;
}

export function ClinicLayout({ children }: ClinicLayoutProps) {
    const isMobile = useIsMobile();

    return (
        <TooltipProvider>
            <div className="flex h-screen w-full bg-background">
                <ClinicSidebar />
                <main
                    className={`min-h-0 flex-1 overflow-auto ${isMobile ? 'pt-14' : ''}`}
                >
                    {children}
                </main>
            </div>
        </TooltipProvider>
    );
}
