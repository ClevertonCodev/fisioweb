import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
    Bell,
    BookOpen,
    Building2,
    ChevronDown,
    Copy,
    LogOut,
    MessageCircle,
    User,
    type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { can } from '@/application/clinic/permissions';
import { DsBadge, dsCn } from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';

import { getSupportWhatsappHref } from './SupportWhatsappButton';

function firstLetter(name?: string): string {
    const trimmed = (name ?? '').trim();
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

interface AccountMenuItem {
    icon: LucideIcon;
    label: string;
    description: string;
    path?: string;
    onClick?: () => void;
    danger?: boolean;
}

export function ClinicAccountMenu() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);

    if (!user) {
        return null;
    }

    const role = user.role as ClinicRole | undefined;
    const isAdmin = can.manageClinicData(role);
    const clinicIdLabel = formatClinicId(user.clinicId);
    const profilePath = user.id
        ? `/clinica/usuarios/${user.id}/editar`
        : '/clinica';

    const handleCopyClinicId = async () => {
        if (clinicIdLabel === '—') {
            toast.error('ID da clínica indisponível.');
            return;
        }
        try {
            await navigator.clipboard.writeText(clinicIdLabel);
            toast.success('ID da clínica copiado.');
            setOpen(false);
        } catch {
            toast.error('Não foi possível copiar o ID da clínica.');
        }
    };

    const handleLogout = () => {
        setOpen(false);
        void logout('clinic').then(() => {
            navigate('/clinica/login', { replace: true });
        });
    };

    const menuItems: AccountMenuItem[] = [
        ...(isAdmin
            ? [
                  {
                      icon: Copy,
                      label: 'ID da clínica',
                      description: `Identificador: ${clinicIdLabel}`,
                      onClick: () => void handleCopyClinicId(),
                  },
                  {
                      icon: Building2,
                      label: 'Dados da clínica',
                      description: 'Visualize e edite os dados da clínica',
                      path: '/clinica/dados',
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
        ...(getSupportWhatsappHref()
            ? [
                  {
                      icon: MessageCircle,
                      label: 'Suporte',
                      description: 'Fale conosco pelo WhatsApp',
                      onClick: () => {
                          const href = getSupportWhatsappHref();
                          if (!href) return;
                          window.open(href, '_blank', 'noopener,noreferrer');
                          setOpen(false);
                      },
                  },
              ]
            : []),
        {
            icon: LogOut,
            label: 'Sair',
            description: 'Encerrar sessão neste dispositivo',
            onClick: handleLogout,
            danger: true,
        },
    ];

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <PopoverPrimitive.Trigger asChild>
                <button
                    type="button"
                    aria-label="Menu da conta"
                    className={dsCn(
                        'flex w-auto cursor-pointer items-center gap-2.5 rounded-ds-pill border border-ds-border-subtle bg-ds-surface-subtle px-1.5 py-1 font-ds text-ds-content-primary transition-colors hover:border-ds-border-brand-subtle hover:bg-ds-surface-brand-subtle focus-visible:shadow-ds-focus focus-visible:outline-none lg:px-2.5',
                    )}
                >
                    <span className="relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-primary-80 text-ds-body-compact font-semibold text-ds-white">
                        {user.photoUrl ? (
                            <img
                                src={user.photoUrl}
                                alt={user.name}
                                className="size-full object-cover"
                            />
                        ) : (
                            firstLetter(user.name)
                        )}
                    </span>
                    <span className="hidden min-w-0 lg:block">
                        <span className="block truncate text-ds-body-compact leading-tight font-semibold">
                            {user.name}
                        </span>
                    </span>
                    <ChevronDown
                        className={dsCn(
                            'size-4 shrink-0 opacity-70 transition-transform',
                            open && 'rotate-180',
                        )}
                    />
                </button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    side="bottom"
                    align="end"
                    sideOffset={8}
                    className="z-[10000] w-68 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-2 font-ds text-ds-content-primary shadow-ds-md"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-ds-border-subtle px-3 py-2.5">
                        <div className="min-w-0">
                            <p className="truncate text-ds-body-xs font-semibold text-ds-content-primary">
                                {user.name}
                            </p>
                            <p className="truncate text-ds-caption text-ds-content-muted">
                                {user.email}
                            </p>
                        </div>
                        {isAdmin ? (
                            <DsBadge variant="primary">
                                #{clinicIdLabel}
                            </DsBadge>
                        ) : null}
                    </div>

                    <div className="mt-1 flex flex-col gap-0.5">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = item.path
                                ? item.path === '/clinica/dados'
                                    ? location.pathname === item.path
                                    : location.pathname.startsWith(item.path)
                                : false;

                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => {
                                        if (item.onClick) {
                                            item.onClick();
                                            return;
                                        }
                                        if (item.path) {
                                            navigate(item.path);
                                            setOpen(false);
                                        }
                                    }}
                                    className={dsCn(
                                        'flex w-full cursor-pointer items-start gap-2.5 rounded-ds-md px-3 py-2 text-left transition-colors',
                                        item.danger
                                            ? 'text-ds-content-danger hover:bg-ds-status-danger-surface'
                                            : active
                                              ? 'bg-ds-surface-subtle text-ds-content-primary'
                                              : 'text-ds-content-primary hover:bg-ds-surface-subtle',
                                    )}
                                >
                                    <Icon
                                        className={dsCn(
                                            'mt-0.5 size-4 shrink-0',
                                            item.danger
                                                ? 'text-ds-content-danger'
                                                : 'text-ds-content-brand',
                                        )}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-ds-body-compact leading-tight font-medium">
                                            {item.label}
                                        </span>
                                        <span className="block text-ds-micro text-ds-content-muted">
                                            {item.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
}
