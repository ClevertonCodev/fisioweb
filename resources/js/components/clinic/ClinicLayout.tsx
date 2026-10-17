import { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

import { ClinicTopbar } from './ClinicTopbar';

interface ClinicLayoutProps {
    children: ReactNode;
}

export function ClinicLayout({ children }: ClinicLayoutProps) {
    return (
        <TooltipProvider>
            <div className="flex h-screen w-full flex-col bg-background">
                <ClinicTopbar />
                <main className="min-h-0 flex-1 overflow-auto">{children}</main>
            </div>
        </TooltipProvider>
    );
}
