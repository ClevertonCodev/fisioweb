import {
    Bell,
    BookOpen,
    Building2,
    ChevronUp,
    Copy,
    LogOut,
    User,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { can } from '@/application/clinic/permissions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import { cn } from '@/lib/utils';

function firstLetter(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const first = trimmed[0]?.toUpperCase();
    return first && /[A-ZÀ-ÖØ-Þ0-9]/i.test(first) ? first.toUpperCase() : '?';
}

function formatClinicId(clinicId?: string | number): string {
    if (clinicId === undefined || clinicId === null || clinicId === '') {
        return '—';
    }
    return String(clinicId);
}

interface ClinicUserDropdownProps {
    collapsed?: boolean;
    placement?: 'sidebar';
}

interface AccountMenuItem {
    icon: LucideIcon;
    label: string;
    description: string;
    path?: string;
    onClick?: () => void;
    adminOnly?: boolean;
}

const popoverItemClass = (active: boolean) =>
    cn(
        'flex w-full cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-200',
        'hover:bg-accent',
        active && 'bg-accent',
    );

export function ClinicUserDropdown({
    collapsed = false,
    placement,
}: ClinicUserDropdownProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const role = user?.role as ClinicRole | undefined;
    const isAdmin = can.manageClinicData(role);
    const isSidebar = placement === 'sidebar';
    const profilePath = user?.id
        ? `/clinica/usuarios/${user.id}/editar`
        : '/clinica';

    const isItemActive = (path: string) =>
        path === '/clinica/dados'
            ? location.pathname === '/clinica/dados'
            : location.pathname.startsWith(path);

    const handleLogout = () => {
        setOpen(false);
        void logout('clinic').then(() => {
            navigate('/clinica/login', { replace: true });
        });
    };

    const handleCopyClinicId = async () => {
        const clinicId = formatClinicId(user?.clinicId);
        if (clinicId === '—') {
            toast.error('ID da clínica indisponível.');
            return;
        }
        try {
            await navigator.clipboard.writeText(clinicId);
            toast.success('ID da clínica copiado.');
            setOpen(false);
        } catch {
            toast.error('Não foi possível copiar o ID da clínica.');
        }
    };

    if (!user) {
        return null;
    }

    const clinicIdLabel = formatClinicId(user.clinicId);

    const menuItems: AccountMenuItem[] = [
        ...(isAdmin
            ? [
                  {
                      icon: Copy,
                      label: 'ID da clínica',
                      description: `Identificador: ${clinicIdLabel}`,
                      onClick: () => void handleCopyClinicId(),
                      adminOnly: true,
                  },
                  {
                      icon: Building2,
                      label: 'Dados da clínica',
                      description: 'Visualize e edite os dados da clínica',
                      path: '/clinica/dados',
                      adminOnly: true,
                  },
              ]
            : []),
        {
            icon: Bell,
            label: 'Notificações',
            description: 'Acompanhe alertas e avisos',
            path: '/clinica/notificacoes',
        },
        {
            icon: BookOpen,
            label: 'Tutoriais',
            description: 'Aprenda a usar o sistema',
            path: '/clinica/tutoriais',
        },
        {
            icon: User,
            label: 'Meu perfil',
            description: 'Edite seus dados pessoais',
            path: profilePath,
        },
        {
            icon: LogOut,
            label: 'Sair',
            description: 'Encerrar sessão neste dispositivo',
            onClick: handleLogout,
        },
    ];

    const handleItemClick = (item: AccountMenuItem) => {
        if (item.onClick) {
            item.onClick();
            return;
        }
        if (item.path) {
            navigate(item.path);
            setOpen(false);
        }
    };

    const trigger = (
        <button
            type="button"
            className={cn(
                'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200',
                'hover:bg-sidebar-accent',
                open
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:text-sidebar-foreground',
                collapsed && 'h-9 w-9 justify-center rounded-full p-0',
                !isSidebar && 'h-9 w-9 justify-center rounded-full p-0',
            )}
            aria-label="Menu da conta"
        >
            <Avatar className="h-8 w-8 shrink-0">
                {user.photoUrl ? (
                    <AvatarImage src={user.photoUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                    {firstLetter(user.name)}
                </AvatarFallback>
            </Avatar>
            {!collapsed && isSidebar ? (
                <>
                    <span className="min-w-0 flex-1 truncate text-left text-sm font-medium">
                        {user.name}
                    </span>
                    <ChevronUp
                        className={cn(
                            'h-4 w-4 shrink-0 opacity-60 transition-transform duration-200',
                            open && 'rotate-180',
                        )}
                    />
                </>
            ) : null}
        </button>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {collapsed && isSidebar ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                            {user.name}
                        </TooltipContent>
                    </Tooltip>
                ) : (
                    trigger
                )}
            </PopoverTrigger>
            <PopoverContent
                side={isSidebar ? 'top' : 'bottom'}
                align={isSidebar ? 'start' : 'end'}
                sideOffset={8}
                className="w-64 space-y-1 p-2"
            >
                <div className="px-3 py-2">
                    <p className="text-foreground text-sm leading-none font-medium">
                        {user.name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs leading-none">
                        {user.email}
                    </p>
                </div>
                <div className="bg-border h-px" />

                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = item.path ? isItemActive(item.path) : false;

                    return (
                        <button
                            key={item.label}
                            type="button"
                            onClick={() => handleItemClick(item)}
                            className={popoverItemClass(active)}
                        >
                            <Icon className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
                            <div className="flex min-w-0 flex-col">
                                <span className="text-foreground text-sm font-medium">
                                    {item.label}
                                </span>
                                <span className="text-muted-foreground text-[11px] leading-tight">
                                    {item.description}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
}
