import type { PropsWithChildren } from 'react';

import { ClinicMobileHeader } from '@/components/clinic-mobile-header';
import { ClinicSidebar } from '@/components/clinic-sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

export default function ClinicLayout({ children }: PropsWithChildren) {
    return (
        <TooltipProvider>
            <div className="clinic-area flex h-screen w-full flex-col bg-background md:flex-row">
                <ClinicMobileHeader />
                <ClinicSidebar />
                <main className="flex-1 overflow-auto">{children}</main>
            </div>
        </TooltipProvider>
    );
}
