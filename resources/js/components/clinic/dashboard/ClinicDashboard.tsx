import {
    Calendar,
    Clock,
    Dumbbell,
    FileText,
    MessageCircle,
    RefreshCw,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useRefreshDashboard } from '@/application/clinic/use-dashboard';
import {
    DsBadge,
    DsButton,
    DsCard,
    DsEmptyState,
    DsKpi,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Birthday,
    DashboardScope,
    DashboardSummary,
} from '@/domain/clinic/dashboard';

import {
    firstName,
    formatTime,
    formatToday,
    initials,
    monthName,
    pickNextSession,
    statusBadgeVariant,
    statusLabel,
    whatsappUrl,
} from './dashboard-format';
import { NextSessionAlert } from './NextSessionAlert';
import { OccupancyRateCard } from './OccupancyRateCard';
import { PatientAcquisitionCard } from './PatientAcquisitionCard';
import { RecentActivitiesCard } from './RecentActivitiesCard';

const QUICK_ACTIONS: {
    title: string;
    description: string;
    icon: typeof Users;
    to: string;
    state?: Record<string, unknown>;
}[] = [
    {
        title: 'Novo paciente',
        description: 'Cadastrar um novo paciente',
        icon: Users,
        to: '/clinica/pacientes/novo',
    },
    {
        title: 'Agendar consulta',
        description: 'Criar novo agendamento',
        icon: Calendar,
        to: '/clinica/agenda',
        state: { openNewAppointment: true },
    },
    {
        title: 'Criar programa',
        description: 'Montar programa de exercícios',
        icon: FileText,
        to: '/clinica/programas/novo',
    },
    {
        title: 'Ver exercícios',
        description: 'Explorar a biblioteca',
        icon: Dumbbell,
        to: '/clinica/exercicios',
    },
];

interface ClinicDashboardProps {
    data?: DashboardSummary;
    isLoading: boolean;
    isError: boolean;
    scope: DashboardScope;
    onScopeChange: (scope: DashboardScope) => void;
    now: Date;
}

function InitialsAvatar({ name, src }: { name: string; src?: string }) {
    return (
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-surface-brand-subtle text-ds-caption font-semibold text-ds-content-brand">
            {src ? (
                <img src={src} alt="" className="size-full object-cover" />
            ) : (
                initials(name)
            )}
        </span>
    );
}

function BirthdayAction({ birthday }: { birthday: Birthday }) {
    if (!birthday.canMessage) {
        return (
            <DsButton
                size="sm"
                variant="secondary"
                label="Sem telefone"
                icon={<MessageCircle />}
                iconPosition="left"
                disabled
            />
        );
    }

    return (
        <a
            href={whatsappUrl(birthday)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex cursor-pointer items-center gap-2 rounded-ds-md border border-ds-primary-80 px-3 py-2 font-ds text-ds-caption font-medium text-ds-primary-80 no-underline hover:bg-ds-surface-brand-subtle ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-60"
        >
            <MessageCircle className="size-4" />
            Mensagem
        </a>
    );
}

export function ClinicDashboard({
    data,
    isLoading,
    isError,
    scope,
    onScopeChange,
    now,
}: ClinicDashboardProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const month = monthName(now);
    const greetingName = firstName(user?.name ?? '');
    // Flags da última resposta boa: trocar o escopo (ou falhar ao trocar) não esconde os controles.
    const [viewer, setViewer] = useState(data?.viewer);
    const refreshDashboard = useRefreshDashboard();
    const [refreshing, setRefreshing] = useState(false);
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await refreshDashboard();
        } finally {
            setRefreshing(false);
        }
    };
    if (data && data.viewer !== viewer) {
        setViewer(data.viewer);
    }
    const canToggleScope = viewer?.canToggleScope ?? false;
    const nextSession = data
        ? pickNextSession(data.upcomingAppointments, now)
        : undefined;

    return (
        <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <div className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="flex items-center gap-2 text-ds-body-sm text-ds-content-muted">
                            <Clock className="size-4" />
                            {formatToday(now)}
                        </p>
                        <h1 className="mt-1 text-ds-page-title font-semibold text-ds-content-primary">
                            {greetingName
                                ? `Bem-vindo de volta, ${greetingName}`
                                : 'Bem-vindo de volta'}
                        </h1>
                        <p className="mt-1 text-ds-body-sm text-ds-content-muted">
                            Resumo da clínica hoje.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <DsButton
                            size="sm"
                            variant="secondary"
                            label="Atualizar dados"
                            icon={<RefreshCw />}
                            iconPosition="left"
                            disabled={refreshing}
                            onClick={handleRefresh}
                        />
                        {canToggleScope ? (
                            <div className="flex rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-1">
                                {(
                                    [
                                        ['clinic', 'Toda a clínica'],
                                        ['mine', 'Somente meus'],
                                    ] as const
                                ).map(([value, label]) => (
                                    <DsButton
                                        key={value}
                                        size="sm"
                                        variant={
                                            scope === value
                                                ? 'primary'
                                                : 'tertiary'
                                        }
                                        label={label}
                                        onClick={() => onScopeChange(value)}
                                    />
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>

                {isError ? (
                    <DsEmptyState
                        variant="error"
                        title="Não foi possível carregar o resumo"
                    />
                ) : null}

                {nextSession ? (
                    <NextSessionAlert appointment={nextSession} now={now} />
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <DsKpi
                        label="Pacientes ativos"
                        value={data?.cards.activePatients ?? '—'}
                        icon={<Users />}
                        loading={isLoading}
                    />
                    <DsKpi
                        label="Consultas hoje"
                        value={data?.cards.appointmentsToday ?? '—'}
                        icon={<Calendar />}
                        loading={isLoading}
                    />
                    <DsKpi
                        label="Programas ativos"
                        value={data?.cards.activePrograms ?? '—'}
                        icon={<FileText />}
                        loading={isLoading}
                    />
                    <DsKpi
                        label="Exercícios disponíveis"
                        value={data?.cards.availableExercises.count ?? '—'}
                        delta={
                            data
                                ? `${data.cards.availableExercises.categoriesCount} categorias`
                                : undefined
                        }
                        icon={<Dumbbell />}
                        loading={isLoading}
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                            <Link
                                key={action.title}
                                to={action.to}
                                state={action.state}
                                className="min-w-0 no-underline"
                            >
                                <DsCard
                                    variant="interactive"
                                    compact
                                    header={
                                        <>
                                            <h3>{action.title}</h3>
                                            <p>{action.description}</p>
                                        </>
                                    }
                                    corner={
                                        <span className="flex size-9 items-center justify-center rounded-ds-md bg-ds-surface-brand-subtle text-ds-content-brand">
                                            <Icon className="size-4" />
                                        </span>
                                    }
                                />
                            </Link>
                        );
                    })}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    <DsCard
                        header={
                            <>
                                <h3>Próximas consultas</h3>
                                <p>Agenda de hoje</p>
                            </>
                        }
                        corner={
                            <DsButton
                                size="sm"
                                variant="tertiary"
                                label="Ver agenda"
                                onClick={() => navigate('/clinica/agenda')}
                            />
                        }
                    >
                        {isError ? (
                            <DsEmptyState variant="error" title="Consultas" />
                        ) : isLoading ? (
                            <p>Carregando…</p>
                        ) : !data?.upcomingAppointments.length ? (
                            <DsEmptyState
                                variant="empty"
                                title="Nenhuma consulta para hoje"
                                description="Quando houver agenda, ela aparece aqui."
                                action={
                                    <DsButton
                                        size="sm"
                                        label="Agendar"
                                        onClick={() =>
                                            navigate('/clinica/agenda', {
                                                state: {
                                                    openNewAppointment: true,
                                                },
                                            })
                                        }
                                    />
                                }
                            />
                        ) : (
                            <ul className="m-0 flex list-none flex-col p-0">
                                {data.upcomingAppointments.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex items-center gap-3 border-b border-ds-border-subtle py-3 last:border-b-0"
                                    >
                                        <InitialsAvatar
                                            name={item.patientName}
                                            src={item.patientPhotoUrl}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-ds-body-xs font-medium text-ds-content-primary">
                                                {item.patientName ||
                                                    'Sem paciente'}
                                            </p>
                                            {item.title ? (
                                                <p className="truncate text-ds-caption text-ds-content-muted">
                                                    {item.title}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1">
                                            <span className="text-ds-body-xs font-medium text-ds-content-primary">
                                                {formatTime(item.startsAt)}
                                            </span>
                                            <DsBadge
                                                variant={statusBadgeVariant(
                                                    item.status,
                                                )}
                                                dot
                                            >
                                                {statusLabel(item.status)}
                                            </DsBadge>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </DsCard>

                    <DsCard
                        header={
                            <>
                                <h3>
                                    {data ? `${data.birthdays.total} ` : ''}
                                    aniversariantes
                                </h3>
                                <p>Em {month}</p>
                            </>
                        }
                    >
                        {isError ? (
                            <DsEmptyState
                                variant="error"
                                title="Aniversariantes"
                            />
                        ) : isLoading ? (
                            <p>Carregando…</p>
                        ) : !data?.birthdays.items.length ? (
                            <DsEmptyState
                                variant="empty"
                                title="Nenhum aniversariante neste mês"
                                description="Quando houver aniversariantes, eles aparecem aqui."
                            />
                        ) : (
                            <ul className="m-0 flex max-h-96 list-none flex-col overflow-y-auto p-0">
                                {data.birthdays.items.map((birthday) => (
                                    <li
                                        key={birthday.patientId}
                                        className="flex items-center gap-3 border-b border-ds-border-subtle py-3 last:border-b-0"
                                    >
                                        <InitialsAvatar
                                            name={birthday.name}
                                            src={birthday.photoUrl}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-ds-body-xs font-medium text-ds-content-primary">
                                                {birthday.name}
                                            </p>
                                            <p className="text-ds-caption text-ds-content-muted">
                                                {birthday.day} de {month}
                                            </p>
                                        </div>
                                        <BirthdayAction birthday={birthday} />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </DsCard>
                </div>

                <OccupancyRateCard
                    canChooseProfessional={
                        viewer?.canChooseProfessional ?? false
                    }
                />

                <PatientAcquisitionCard scope={scope} />

                <RecentActivitiesCard
                    enabled={viewer?.canViewActivities ?? false}
                />

                <p className="flex items-center gap-2 text-ds-caption text-ds-content-muted">
                    <Clock className="size-3.5" />
                    <Link
                        to="/clinica/agenda"
                        className="text-ds-content-brand hover:underline ds-dark:text-ds-primary-60"
                    >
                        Abrir a agenda completa
                    </Link>
                </p>
            </div>
        </div>
    );
}
