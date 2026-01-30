import type { PropsWithChildren } from 'react';

import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';

export default function ClinicLayout({ children }: PropsWithChildren) {
    return (
        <div className="clinic-area min-h-screen w-full">
            <AppShell variant="sidebar">
                <AppSidebar />
                <AppContent variant="sidebar" className="overflow-x-hidden">
                    {children}
                </AppContent>
            </AppShell>
        </div>
    );
}
