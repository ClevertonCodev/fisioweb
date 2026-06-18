import {
    Activity,
    BarChart3,
    Bell,
    Building2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Cog,
    CreditCard,
    Dumbbell,
    Home,
    LayoutGrid,
    LogOut,
    Menu,
    ScrollText,
    Sparkles,
    User,
    Video,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    external?: boolean;
    children?: {
        icon: React.ElementType;
        label: string;
        description: string;
        path: string;
    }[];
}

const mainNavItems: NavItem[] = [
    { icon: Home, label: 'Dashboard', path: '/admin' },
    { icon: Building2, label: 'Clínicas', path: '/admin/clinicas' },
    {
        icon: Dumbbell,
        label: 'Exercícios',
        path: '/admin/exercicios',
        children: [
            {
                icon: Video,
                label: 'Vídeos',
                description: 'Gerencie os vídeos do sistema',
                path: '/admin/videos',
            },
            {
                icon: Dumbbell,
                label: 'Exercícios',
                description: 'Gerencie os exercícios do sistema',
                path: '/admin/exercicios',
            },
            {
                icon: ClipboardList,
                label: 'Programas',
                description: 'Gerencie os programas template',
                path: '/admin/programas',
            },
        ],
    },
    {
        icon: CreditCard,
        label: 'Planos',
        path: '/admin/planos',
        children: [
            {
                icon: Sparkles,
                label: 'Funcionalidades',
                description: 'Gerencie as funcionalidades disponíveis',
                path: '/admin/funcionalidades',
            },
            {
                icon: LayoutGrid,
                label: 'Planos',
                description: 'Gerencie os planos disponíveis no sistema',
                path: '/admin/planos',
            },
            {
                icon: Cog,
                label: 'Configurar Funcionalidades',
                description: 'Configure as funcionalidades para cada plano',
                path: '/admin/planos/configurar',
            },
        ],
    },
    { icon: BarChart3, label: 'Relatórios', path: '/admin/relatorios' },
];

const bottomNavItems = [
    { icon: Bell, label: 'Notificações', path: '/admin/notificacoes' },
    { icon: ScrollText, label: 'Logs', path: '/log-viewer', external: true },
    { icon: User, label: 'Perfil', path: '/admin/perfil' },
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
    const { logout } = useAuth();
    const [openDropdownPath, setOpenDropdownPath] = useState<string | null>(
        null,
    );

    const handleLogout = () => {
        logout('admin').then(() => {
            onNavClick?.();
            navigate('/admin/login', { replace: true });
        });
    };

    const isActive = (path: string) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(path);
    };

    const NavItemSimple = ({ item }: { item: NavItem }) => {
        const active = isActive(item.path);
        const Icon = item.icon;

        const linkClass = cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
            'hover:bg-sidebar-accent',
            active
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/80 hover:text-sidebar-foreground',
        );

        const content = item.external ? (
            <a
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
            >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                )}
            </a>
        ) : (
            <NavLink to={item.path} onClick={onNavClick} className={linkClass}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                )}
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

    const NavItemWithChildren = ({ item }: { item: NavItem }) => {
        const Icon = item.icon;
        const childActive = item.children!.some((c) => isActive(c.path));
        const isOpen = openDropdownPath === item.path;

        return (
            <Popover
                open={isOpen}
                onOpenChange={(open) =>
                    setOpenDropdownPath(open ? item.path : null)
                }
            >
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                            'hover:bg-sidebar-accent',
                            childActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                : 'text-sidebar-foreground/80 hover:text-sidebar-foreground',
                        )}
                    >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                            <>
                                <span className="flex-1 text-left text-sm font-medium">
                                    {item.label}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 transition-transform duration-200',
                                        isOpen && 'rotate-180',
                                    )}
                                />
                            </>
                        )}
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    side="right"
                    align="start"
                    sideOffset={8}
                    className="w-64 space-y-1 p-2"
                >
                    {item.children!.map((child) => {
                        const ChildIcon = child.icon;
                        const cActive = isActive(child.path);
                        return (
                            <button
                                key={child.path}
                                type="button"
                                onClick={() => {
                                    navigate(child.path);
                                    setOpenDropdownPath(null);
                                    onNavClick?.();
                                }}
                                className={cn(
                                    'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
                                    'hover:bg-accent',
                                    cActive && 'bg-accent',
                                )}
                            >
                                <ChildIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-foreground">
                                        {child.label}
                                    </span>
                                    <span className="text-[11px] leading-tight text-muted-foreground">
                                        {child.description}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </PopoverContent>
            </Popover>
        );
    };

    const renderNavItem = (item: NavItem) => {
        if (item.children)
            return <NavItemWithChildren key={item.path} item={item} />;
        return <NavItemSimple key={item.path} item={item} />;
    };

    return (
        <>
            <div className="flex items-center justify-between border-b border-sidebar-border p-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
                        <Activity className="h-5 w-5 text-sidebar-primary-foreground" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-sidebar-foreground">
                                FisioElite
                            </span>
                            <span className="text-[10px] tracking-wider text-sidebar-foreground/50 uppercase">
                                Admin
                            </span>
                        </div>
                    )}
                </div>
                {!onNavClick && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="h-8 w-8 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
                {mainNavItems.map((item) => renderNavItem(item))}
            </nav>

            <div className="space-y-1 border-t border-sidebar-border p-3">
                {bottomNavItems.map((item) => (
                    <NavItemSimple key={item.path} item={item} />
                ))}
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sidebar-foreground/60 transition-all duration-200 hover:bg-sidebar-accent hover:text-destructive"
                >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                        <span className="text-sm font-medium">Sair</span>
                    )}
                </button>
            </div>
        </>
    );
}

export function AdminSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <div className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent
                        side="left"
                        className="w-60 border-sidebar-border bg-sidebar p-0"
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
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary">
                        <Activity className="h-4 w-4 text-sidebar-primary-foreground" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-sidebar-foreground">
                            FisioElite
                        </span>
                        <span className="text-[10px] tracking-wider text-sidebar-foreground/50 uppercase">
                            Admin
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <aside
            className={cn(
                'flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
                collapsed ? 'w-16' : 'w-60',
            )}
        >
            <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
        </aside>
    );
}
