import {
    Calendar,
    DollarSign,
    Dumbbell,
    Home,
    Menu,
    Play,
    Plus,
    User,
    Users,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import { AppLogo } from '@/components/AppLogo';
import {
    DsButton,
    DsDrawer,
    DsThemeToggle,
    DsTooltip,
    dsCn,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';

import { ClinicAccountMenu } from './ClinicAccountMenu';

interface ClinicNavItem {
    icon: LucideIcon;
    label: string;
    shortLabel: string;
    path: string;
    activePath?: string;
}

export function getClinicNavItems(role?: ClinicRole): ClinicNavItem[] {
    return [
        {
            icon: Home,
            label: 'Dashboard',
            shortLabel: 'Início',
            path: '/clinica',
        },
        {
            icon: Calendar,
            label: 'Agenda',
            shortLabel: 'Agenda',
            path: '/clinica/agenda',
        },
        {
            icon: Users,
            label: 'Pacientes',
            shortLabel: 'Pacientes',
            path: '/clinica/pacientes',
        },
        {
            icon: Dumbbell,
            label: 'Programas e Exercícios',
            shortLabel: 'Programas',
            path: '/clinica/programas/historico',
            activePath: '/clinica/programas',
        },
        {
            icon: Play,
            label: 'Exercícios',
            shortLabel: 'Exercícios',
            path: '/clinica/exercicios',
        },
        ...(can.manageUsers(role)
            ? [
                  {
                      icon: DollarSign,
                      label: 'Finanças',
                      shortLabel: 'Finanças',
                      path: '/clinica/financas',
                  },
                  {
                      icon: User,
                      label: 'Usuários',
                      shortLabel: 'Usuários',
                      path: '/clinica/usuarios',
                  },
              ]
            : []),
    ];
}

function isClinicNavActive(pathname: string, item: ClinicNavItem): boolean {
    const target = item.activePath ?? item.path;
    if (target === '/clinica') {
        return pathname === '/clinica';
    }
    return pathname.startsWith(target);
}

const navLinkActiveClass =
    'bg-ds-primary-80 text-ds-white shadow-ds-xs ds-dark:bg-ds-white ds-dark:text-ds-primary-80';
const navLinkIdleClass =
    'text-ds-primary-80 hover:bg-ds-surface-brand-subtle ds-dark:text-ds-white ds-dark:hover:bg-ds-white/10';

export function ClinicTopbar() {
    const location = useLocation();
    const { user } = useAuth();
    const role = user?.role as ClinicRole | undefined;
    const items = getClinicNavItems(role);
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="z-30 shrink-0 border-b border-ds-border-subtle bg-ds-surface-default font-ds text-ds-content-primary shadow-ds-xs">
            <div className="mx-auto flex h-[72px] max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6">
                <div className="flex min-w-0 shrink-0 items-center gap-1.5">
                    <DsButton
                        label="Abrir menu"
                        icon={<Menu />}
                        iconPosition="only"
                        variant="tertiary"
                        size="sm"
                        tooltipPlacement="bottom"
                        className="size-9 rounded-ds-full border-ds-border-subtle md:hidden ds-dark:text-ds-white ds-dark:hover:bg-ds-white/10 ds-dark:hover:text-ds-white [&_svg]:size-5"
                        onClick={() => setMenuOpen(true)}
                    />
                    <Link
                        to="/clinica"
                        className="flex shrink-0 items-center gap-2.5"
                        aria-label="IVS Fisioterapia e Saúde — início"
                    >
                        <AppLogo className="size-10 ds-dark:text-ds-white" />
                        <div className="hidden leading-tight lg:block">
                            <p className="text-ds-body-sm font-semibold text-ds-primary-80 ds-dark:text-ds-white">
                                IVS
                            </p>
                            <p className="font-ds-mono text-[10px] tracking-wider text-ds-content-muted uppercase">
                                Fisioterapia e Saúde
                            </p>
                        </div>
                    </Link>
                </div>

                <nav
                    aria-label="Navegação principal"
                    className="hidden min-w-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] md:flex"
                >
                    {items.map((item) => {
                        const Icon = item.icon;
                        const active = isClinicNavActive(
                            location.pathname,
                            item,
                        );

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                aria-current={active ? 'page' : undefined}
                                title={item.label}
                                className={dsCn(
                                    'flex w-[66px] shrink-0 flex-col items-center justify-center gap-1 rounded-ds-xl py-1.5 transition-all xl:w-[76px]',
                                    active
                                        ? navLinkActiveClass
                                        : navLinkIdleClass,
                                )}
                            >
                                <Icon className="size-[18px] shrink-0" />
                                <span className="px-1 text-[10px] leading-[1.4] font-medium whitespace-nowrap">
                                    {item.shortLabel}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex shrink-0 items-center gap-2">
                    <DsTooltip
                        content="Agendar consulta"
                        placement="bottom"
                        asChild
                    >
                        <Link
                            to="/clinica/agenda"
                            state={{ openNewAppointment: true }}
                            aria-label="Agendar consulta"
                            className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-ds-full bg-ds-primary-80 text-ds-white transition-colors hover:bg-ds-primary-100 ds-dark:bg-ds-white ds-dark:text-ds-primary-80 ds-dark:hover:bg-ds-white/90"
                        >
                            <Plus className="size-5" />
                        </Link>
                    </DsTooltip>
                    <DsThemeToggle className="size-9 rounded-ds-full" />
                    <ClinicAccountMenu />
                </div>
            </div>

            <DsDrawer
                open={menuOpen}
                onOpenChange={setMenuOpen}
                title="Menu"
                placement="left"
                size="sm"
            >
                <nav
                    aria-label="Menu da clínica"
                    className="flex flex-col gap-1"
                >
                    {items.map((item) => {
                        const Icon = item.icon;
                        const active = isClinicNavActive(
                            location.pathname,
                            item,
                        );

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                aria-current={active ? 'page' : undefined}
                                onClick={() => setMenuOpen(false)}
                                className={dsCn(
                                    'flex items-center gap-3 rounded-ds-xl px-3 py-3 text-ds-body-sm font-medium',
                                    active
                                        ? navLinkActiveClass
                                        : navLinkIdleClass,
                                )}
                            >
                                <Icon className="size-5 shrink-0" />
                                {item.shortLabel}
                            </Link>
                        );
                    })}
                </nav>
            </DsDrawer>
        </header>
    );
}
