import type { PropsWithChildren } from 'react';
import { Activity, Menu } from 'lucide-react';
import { useEffect } from 'react';

import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { dashboard as clinicDashboard } from '@/routes/clinic';

function ClinicMobileHeader() {
    const { toggleSidebar } = useSidebar();
    const dashboardUrl = clinicDashboard().url;

    return (
        <header
            className="clinic-mobile-header sticky top-0 z-20 grid h-14 shrink-0 grid-cols-3 items-center border-b px-4 md:hidden"
            data-sidebar="header"
        >
            <div className="flex justify-start">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={toggleSidebar}
                    className="clinic-mobile-trigger h-9 w-9"
                    aria-label="Abrir menu"
                >
                    <Menu className="size-6" />
                </Button>
            </div>
            <a
                href={dashboardUrl}
                className="clinic-mobile-brand flex items-center justify-center gap-2 font-semibold"
            >
                <div className="clinic-sidebar-logo flex size-8 shrink-0 items-center justify-center rounded-lg">
                    <Activity className="size-5 shrink-0" />
                </div>
                <span className="clinic-sidebar-brand">FisioElite</span>
            </a>
            <div className="w-9 shrink-0" aria-hidden />
        </header>
    );
}

export default function ClinicLayout({ children }: PropsWithChildren) {
    useEffect(() => {
        document.body.setAttribute('data-area', 'clinic');
        return () => document.body.removeAttribute('data-area');
    }, []);

    return (
        <div className="clinic-area min-h-screen w-full">
            <AppShell variant="sidebar">
                <AppSidebar />
                <div className="flex min-h-svh w-full flex-col">
                    <ClinicMobileHeader />
                    <AppContent variant="sidebar" className="overflow-x-hidden">
                        {children}
                    </AppContent>
                </div>
            </AppShell>
        </div>
    );
}
