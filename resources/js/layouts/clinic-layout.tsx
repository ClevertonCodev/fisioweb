import type { PropsWithChildren } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ClinicSidebar } from '@/components/clinic-sidebar';
import { useEffect } from 'react';

export default function ClinicLayout({ children }: PropsWithChildren) {
    return (
        <TooltipProvider>
            <div className="clinic-area flex h-screen w-full bg-background">
                <ClinicSidebar />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </TooltipProvider>
    );
}
