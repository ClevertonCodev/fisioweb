import { Link } from '@inertiajs/react';
import {
    Activity,
    Bell,
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    FileText,
    Headphones,
    LayoutGrid,
    User,
    Users,
    X,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { dashboard as clinicDashboard } from '@/routes/clinic';
import { type NavItem } from '@/types';

const dashboardRoute = clinicDashboard();

const mainNavItems: NavItem[] = [
    { title: 'Dashboard', href: dashboardRoute, icon: LayoutGrid },
    { title: 'Agenda', href: '/clinic/agenda', icon: Calendar },
    { title: 'Pacientes', href: '/clinic/pacientes', icon: Users },
    { title: 'Exercícios', href: '/clinic/exercicios', icon: Dumbbell },
    { title: 'Programas', href: '/clinic/programas', icon: FileText },
];

const footerNavItems: NavItem[] = [
    { title: 'Notificações', href: '/clinic/notificacoes', icon: Bell },
    { title: 'Tutoriais', href: '/clinic/tutoriais', icon: BookOpen },
    { title: 'Suporte', href: '/clinic/suporte', icon: Headphones },
    { title: 'Perfil', href: '/clinic/settings/profile', icon: User },
];

function ClinicSidebarHeader({ onToggle }: { onToggle: () => void }) {
    const { state, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <SidebarHeader
            className={cn(
                '!flex !flex-row !gap-2 border-sidebar-border w-full items-center border-b py-3',
                isCollapsed && !isMobile ? 'justify-center px-3' : 'justify-between px-3',
            )}
        >
            <Link
                href={dashboardRoute}
                prefetch
                className={cn(
                    'flex min-w-0 items-center gap-2 overflow-hidden',
                    isCollapsed && !isMobile ? 'shrink-0' : 'flex-1',
                )}
            >
                <div className="clinic-sidebar-logo flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground sm:size-8">
                    <Activity className="size-5 shrink-0 sm:size-4" />
                </div>
                {(!isCollapsed || isMobile) && (
                    <span className="clinic-sidebar-brand truncate font-semibold text-white">
                        FisioElite
                    </span>
                )}
            </Link>
            {(!isCollapsed || isMobile) && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="clinic-sidebar-toggle h-8 w-8 shrink-0 text-white hover:bg-white/10 hover:text-white"
                    aria-label={isMobile ? 'Fechar menu' : 'Recolher menu'}
                >
                    {isMobile ? (
                        <X className="size-5" />
                    ) : (
                        <ChevronLeft className="size-4" />
                    )}
                </Button>
            )}
        </SidebarHeader>
    );
}

export function ClinicSidebar() {
    const { state, toggleSidebar, isMobile } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <Sidebar collapsible="icon" variant="inset">
            <ClinicSidebarHeader onToggle={toggleSidebar} />
            <SidebarContent className="clinic-sidebar-content scrollbar-thin overflow-y-auto px-3 py-2">
                <NavMain items={mainNavItems} groupLabel={null} />
            </SidebarContent>
            <SidebarFooter className="clinic-sidebar-footer border-sidebar-border flex flex-col border-t px-3 py-2">
                <NavMain items={footerNavItems} groupLabel={null} />
                <NavUser />
                {/* No mobile: botão "Fechar" claro; no desktop: seta para expandir só quando recolhido */}
                {isMobile ? (
                    <div className="mt-3 flex justify-center">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={toggleSidebar}
                            className="clinic-sidebar-close-drawer w-full border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            aria-label="Fechar menu"
                        >
                            <X className="mr-2 size-4" />
                            Fechar menu
                        </Button>
                    </div>
                ) : (
                    isCollapsed && (
                        <div className="mt-2 flex justify-center">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleSidebar}
                                className="clinic-sidebar-toggle h-8 w-8 text-white hover:bg-white/10 hover:text-white"
                                aria-label="Abrir menu"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    )
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
