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
    Home,
    User,
    Users,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useActiveUrl } from '@/hooks/use-active-url';
import { dashboard as clinicDashboard } from '@/routes/clinic';

const dashboardRoute = clinicDashboard();

const mainNavItems = [
    { icon: Home, label: 'Dashboard', path: dashboardRoute },
    { icon: Calendar, label: 'Agenda', path: '/clinic/agenda' },
    { icon: Users, label: 'Pacientes', path: '/clinic/pacientes' },
    { icon: Dumbbell, label: 'Exercícios', path: '/clinic/exercises' },
    { icon: FileText, label: 'Programas', path: '/clinic/programas' },
];

const bottomNavItems = [
    { icon: Bell, label: 'Notificações', path: '/clinic/notificacoes' },
    { icon: BookOpen, label: 'Tutoriais', path: '/clinic/tutoriais' },
    { icon: Headphones, label: 'Suporte', path: '/clinic/suporte' },
    { icon: User, label: 'Perfil', path: '/clinic/settings/profile' },
];

type ClinicSidebarVariant = 'sidebar' | 'drawer';

interface ClinicSidebarProps {
    variant?: ClinicSidebarVariant;
    onNavigate?: () => void;
}

export function ClinicSidebar({ variant = 'sidebar', onNavigate }: ClinicSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const { urlIsActive, urlIsActiveOrPrefix } = useActiveUrl();
    const isDrawer = variant === 'drawer';

    const isActive = (path: typeof dashboardRoute | string) => {
        if (path === dashboardRoute) {
            return urlIsActive(path);
        }
        return urlIsActiveOrPrefix(path);
    };

    // Cores da sidebar Lovable (escura com turquesa)
    const sidebarColors = {
        '--sidebar-bg': 'hsl(200 25% 18%)',
        '--sidebar-fg': 'hsl(180 10% 95%)',
        '--sidebar-primary': 'hsl(175 70% 45%)',
        '--sidebar-primary-fg': 'hsl(0 0% 100%)',
        '--sidebar-accent': 'hsl(200 20% 25%)',
        '--sidebar-accent-fg': 'hsl(180 10% 95%)',
        '--sidebar-border': 'hsl(200 20% 25%)',
    } as React.CSSProperties;

    const NavItem = ({ item }: { item: (typeof mainNavItems)[0] }) => {
        const active = isActive(item.path);
        const Icon = item.icon;

        const linkStyle = active
            ? {
                backgroundColor: 'var(--sidebar-primary)',
                color: 'var(--sidebar-primary-fg)',
            }
            : {
                color: 'var(--sidebar-fg)',
            };

        const linkHoverClass = active ? '' : 'hover:bg-[var(--sidebar-accent)]';

        const showLabel = isDrawer || !collapsed;
        const content = (
            <Link
                href={item.path}
                prefetch
                onClick={isDrawer ? onNavigate : undefined}
                className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    linkHoverClass,
                )}
                style={linkStyle}
            >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {showLabel && (
                    <span className="text-sm font-medium">{item.label}</span>
                )}
            </Link>
        );

        if (!isDrawer && collapsed) {
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

    const navContent = (
        <>
            {/* Logo */}
            <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: 'var(--sidebar-border)' }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg"
                        style={{
                            backgroundColor: 'var(--sidebar-primary)',
                            color: 'var(--sidebar-primary-fg)',
                        }}
                    >
                        <Activity className="h-5 w-5" />
                    </div>
                    {(isDrawer || !collapsed) && (
                        <span
                            className="font-semibold"
                            style={{ color: 'var(--sidebar-fg)' }}
                        >
                            FisioElite
                        </span>
                    )}
                </div>
                {!isDrawer && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="h-8 w-8 hover:bg-[var(--sidebar-accent)]"
                        style={{ color: 'var(--sidebar-fg)' }}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
                {mainNavItems.map((item) => (
                    <NavItem key={item.label} item={item} />
                ))}
            </nav>

            {/* Bottom Navigation */}
            <div
                className="p-3 space-y-1 border-t"
                style={{ borderColor: 'var(--sidebar-border)' }}
            >
                {bottomNavItems.map((item) => (
                    <NavItem key={item.label} item={item} />
                ))}
            </div>
        </>
    );

    if (isDrawer) {
        return (
            <div
                className="flex h-full flex-col w-64"
                style={{
                    ...sidebarColors,
                    backgroundColor: 'var(--sidebar-bg)',
                    borderColor: 'var(--sidebar-border)',
                }}
            >
                {navContent}
            </div>
        );
    }

    return (
        <aside
            className={cn(
                'hidden md:flex flex-col h-screen border-r transition-all duration-300',
                collapsed ? 'w-16' : 'w-60',
            )}
            style={{
                ...sidebarColors,
                backgroundColor: 'var(--sidebar-bg)',
                borderColor: 'var(--sidebar-border)',
            }}
        >
            {navContent}
        </aside>
    );
}
