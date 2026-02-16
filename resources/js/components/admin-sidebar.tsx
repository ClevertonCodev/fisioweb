import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Building2,
    Dumbbell,
    Folder,
    LayoutGrid,
    Video,
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
} from '@/components/ui/sidebar';
import { dashboard as adminDashboard } from '@/routes/admin';
import { type NavItem } from '@/types';

import AppLogo from './app-logo';

const dashboardRoute = adminDashboard();

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboardRoute,
        icon: LayoutGrid,
    },
    {
        title: 'Clinicas',
        href: '/admin/clinics',
        icon: Building2,
    },
    {
        title: 'Vídeos',
        href: '/admin/videos',
        icon: Video,
    },
    {
        title: 'Exercícios',
        href: '/admin/exercises',
        icon: Dumbbell,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AdminSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardRoute} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
