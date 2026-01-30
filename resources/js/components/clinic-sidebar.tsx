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
} from 'lucide-react';

import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
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
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    return (
        <SidebarHeader
            className={cn(
                '!flex !flex-row !gap-2 border-sidebar-border w-full items-center border-b py-3',
                isCollapsed ? 'justify-center px-3' : 'justify-between px-3',
            )}
        >
            <Link
                href={dashboardRoute}
                prefetch
                className={cn(
                    'flex min-w-0 items-center gap-2 overflow-hidden',
                    isCollapsed ? 'shrink-0' : 'flex-1',
                )}
            >
                <div className="clinic-sidebar-logo flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Activity className="size-5 shrink-0" />
                </div>
                {!isCollapsed && (
                    <span className="clinic-sidebar-brand truncate font-semibold text-white">
                        FisioElite
                    </span>
                )}
            </Link>
            {!isCollapsed && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggle}
                    className="clinic-sidebar-toggle h-8 w-8 shrink-0 text-white hover:bg-white/10 hover:text-white"
                    aria-label="Fechar menu"
                >
                    <ChevronLeft className="size-4" />
                </Button>
            )}
        </SidebarHeader>
    );
}

export function ClinicSidebar() {
    const { state, toggleSidebar } = useSidebar();
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
                {isCollapsed && (
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
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
