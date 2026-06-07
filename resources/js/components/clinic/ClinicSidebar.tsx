import {
    Activity,
    Bell,
    BookOpen,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    Headphones,
    Home,
    LogOut,
    Menu,
    Play,
    User,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';


const bottomNavItems = (profilePath: string) => [
    { icon: Bell, label: 'Notificações', path: '/clinica/notificacoes' },
    { icon: BookOpen, label: 'Tutoriais', path: '/clinica/tutoriais' },
    { icon: Headphones, label: 'Suporte', path: '/clinica/suporte' },
    { icon: User, label: 'Perfil', path: profilePath },
];

function SidebarContent({
    collapsed,
    setCollapsed,
    onNavClick,
}: {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
    onNavClick?: () => void;
}) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const role = user?.role as ClinicRole | undefined;
    const profilePath = user?.id ? `/clinica/usuarios/${user.id}/editar` : '/clinica';

    const allNavItems = [
        { icon: Home, label: 'Dashboard', path: '/clinica' },
        { icon: Calendar, label: 'Agenda', path: '/clinica/agenda' },
        { icon: Users, label: 'Pacientes', path: '/clinica/pacientes' },
        {
            icon: Dumbbell,
            label: 'Programas e Exercícios',
            path: '/clinica/programas/historico',
            activePath: '/clinica/programas',
        },
        { icon: Play, label: 'Exercícios', path: '/clinica/exercicios' },
        ...(can.manageUsers(role)
            ? [{ icon: User, label: 'Usuários', path: '/clinica/usuarios' }]
            : []),
    ];

    const handleLogout = () => {
        logout('clinic').then(() => {
            onNavClick?.();
            navigate('/clinica/login', { replace: true });
        });
    };

    const isActive = (path: string) => {
        if (path === '/clinica') return location.pathname === '/clinica';
        return location.pathname.startsWith(path);
    };

    const NavItem = ({
        item,
    }: {
        item: { icon: React.ElementType; label: string; path: string; activePath?: string };
    }) => {
        const active = isActive(item.activePath ?? item.path);
        const Icon = item.icon;

        const content = (
            <NavLink
                to={item.path}
                end={item.path === '/clinica'}
                onClick={onNavClick}
                className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                    'hover:bg-sidebar-accent',
                    active
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground/80 hover:text-sidebar-foreground',
                )}
            >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
        );

        if (collapsed) {
            return (
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                        {item.label}
                    </TooltipContent>
                </Tooltip>
            );
        }
        return content;
    };

    return (
        <>
            {/* Logo */}
            <div className="border-sidebar-border flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                    <div className="bg-sidebar-primary flex h-8 w-8 items-center justify-center rounded-lg">
                        <Activity className="text-sidebar-primary-foreground h-5 w-5" />
                    </div>
                    {!collapsed && (
                        <span className="text-sidebar-foreground font-semibold">FisioElite</span>
                    )}
                </div>
                {!onNavClick && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8"
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>

            <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3">
                {allNavItems.map((item) => (
                    <NavItem key={item.path} item={item} />
                ))}
            </nav>

            <div className="border-sidebar-border space-y-1 border-t p-3">
                {bottomNavItems(profilePath).map((item) => (
                    <NavItem key={item.path} item={item} />
                ))}

                {collapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleLogout}
                                className="text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200"
                            >
                                <LogOut className="h-5 w-5 flex-shrink-0" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                            Sair
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    <button
                        onClick={handleLogout}
                        className="text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200"
                    >
                        <LogOut className="h-5 w-5 flex-shrink-0" />
                        <span className="text-sm font-medium">Sair</span>
                    </button>
                )}
            </div>
        </>
    );
}

export function ClinicSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <>
                {/* Mobile top bar */}
                <div className="bg-sidebar border-sidebar-border fixed top-0 right-0 left-0 z-50 flex h-14 items-center gap-3 border-b px-4">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-sidebar-foreground hover:bg-sidebar-accent h-9 w-9"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="left"
                            className="bg-sidebar border-sidebar-border w-60 p-0"
                        >
                            <div className="flex h-full flex-col">
                                <SidebarContent
                                    collapsed={false}
                                    setCollapsed={() => {}}
                                    onNavClick={() => setOpen(false)}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <div className="flex items-center gap-2">
                        <div className="bg-sidebar-primary flex h-7 w-7 items-center justify-center rounded-md">
                            <Activity className="text-sidebar-primary-foreground h-4 w-4" />
                        </div>
                        <span className="text-sidebar-foreground text-sm font-semibold">
                            FisioElite
                        </span>
                    </div>
                </div>
            </>
        );
    }

    return (
        <aside
            className={cn(
                'bg-sidebar border-sidebar-border flex h-screen flex-col border-r transition-all duration-300',
                collapsed ? 'w-16' : 'w-60',
            )}
        >
            <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
        </aside>
    );
}
