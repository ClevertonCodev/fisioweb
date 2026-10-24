/**
 * Painel de acompanhamento: a tela responde primeiro "como está esse
 * paciente?". Cabeçalho com a próxima consulta, alerta de faltas seguidas,
 * números do tratamento, a frequência dos últimos 12 meses e os próximos
 * passos. Os registros vêm embaixo, em abas por tipo.
 */
import {
    AlertTriangle,
    ArrowLeft,
    CalendarCheck,
    CalendarClock,
    CalendarX,
    Check,
    ChevronRight,
    Clock,
    MessageCircle,
    Pencil,
    Phone,
    Search,
    Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { patientDisplayName } from '@/application/clinic/patient-display-name';
import {
    DS_STATUS,
    STATUS_ORDER,
    statusLabel,
} from '@/components/clinic/agenda/agenda-shared';
import {
    DsAlert,
    DsButton,
    dsCn,
    DsEmptyState,
    DsInput,
    DsKpi,
    DsTabs,
    DsTooltip,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { Appointment } from '@/domain/clinic';
import { useIsBelowSm } from '@/hooks/use-below-sm';
import { PatientStatusBadge } from '@/pages/clinic/patient/patient-list/patient-status';
import { PatientAvatar } from '@/pages/clinic/patient/patient-list/PatientAvatar';

import {
    ageOf,
    formatDate,
    formatPhone,
    formatTime,
    KIND_META,
    matchesSearch,
    relativeDay,
    tabFromSearchParam,
    type RecordItem,
    type RecordKind,
} from './data';
import {
    CLINICAL_DENIED,
    GuardedButton,
    KindIcon,
    QUICK_ACTIONS,
    ToneBadge,
    type QuickAction,
} from './parts';
import { whatsappChatUrl } from './share';

export interface VariantProps {
    id: string;
    data: import('./data').PatientRecordData;
    onOpen: (item: RecordItem) => void;
    onAction: (action: QuickAction) => void;
    canManageClinical: boolean;
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * Botões de registro, sempre juntos acima das abas, qualquer que seja a
 * aba aberta. Agendar fica no cartão da próxima consulta, e programa, nos
 * próximos passos.
 */
const RECORD_ACTIONS: QuickAction[] = [
    'evolucao',
    'avaliacao',
    'questionario',
    'arquivo',
];

interface Step {
    key: string;
    icon: ReactNode;
    title: string;
    hint: string;
    action?: { label: string; run: () => void; clinical?: boolean };
    tone: 'warning' | 'brand' | 'muted';
}

export function VariantB({
    id,
    data,
    onOpen,
    onAction,
    canManageClinical,
}: VariantProps) {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const runAction = onAction;
    const { user } = useAuth();
    const { patient, items, stats, isLoading } = data;
    const listErrors = data.listErrors ?? {
        evolutions: false,
        assessments: false,
        questionnaires: false,
        files: false,
        appointments: false,
        programs: false,
    };
    const tab = tabFromSearchParam(params.get('tab'));
    const [search, setSearch] = useState('');
    const recordsSectionRef = useRef<HTMLElement>(null);
    const [now] = useState(() => Date.now());
    const isMobile = useIsBelowSm();
    const isPhysio = user?.role === 'physiotherapist';

    const shownName = patient ? patientDisplayName(patient) : 'Carregando…';
    const age = ageOf(patient?.birthDate);
    const monthsInCare = stats.monthsInCare;

    const setTab = (next: string) => {
        setParams(
            (prev) => {
                const nextParams = new URLSearchParams(prev);
                const nextTab = tabFromSearchParam(next);
                if (nextTab === 'clinico') {
                    nextParams.delete('tab');
                } else {
                    nextParams.set('tab', nextTab);
                }
                return nextParams;
            },
            { replace: true },
        );
    };

    useEffect(() => {
        if (tab !== 'arquivos') return;
        const el = recordsSectionRef.current;
        if (!el || typeof el.scrollIntoView !== 'function') return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [tab]);

    const steps = useMemo<Step[]>(() => {
        const list: Step[] = stats.pending.map((p) => ({
            key: p.key,
            icon: <Clock />,
            title: `${KIND_META[p.kind].label} em aberto`,
            hint: p.title,
            action: { label: 'Abrir', run: () => onOpen(p) },
            tone: 'warning',
        }));
        const lastEvolution = items.find((i) => i.kind === 'evolucao');
        const lastAssessment = items.find(
            (i) => i.kind === 'avaliacao' && i.date,
        );
        if (stats.last?.date) {
            const evolved =
                lastEvolution?.date &&
                lastEvolution.date.getTime() >= stats.last.date.getTime() - DAY;
            if (!evolved) {
                list.push({
                    key: 'evolucao-falta',
                    icon: <Pencil />,
                    title: 'Sessão sem evolução',
                    hint: `${stats.last.title} de ${formatDate(stats.last.date, false)} ainda não tem evolução.`,
                    action: {
                        label: 'Escrever',
                        run: () => runAction('evolucao'),
                        clinical: true,
                    },
                    tone: 'brand',
                });
            }
        }
        if (
            !lastAssessment?.date ||
            now - lastAssessment.date.getTime() > 21 * DAY
        ) {
            list.push({
                key: 'reavaliar',
                icon: <CalendarCheck />,
                title: 'Hora de reavaliar',
                hint: lastAssessment?.date
                    ? `Última avaliação ${relativeDay(lastAssessment.date)}.`
                    : 'Nenhuma avaliação assinada.',
                action: {
                    label: 'Avaliar',
                    run: () => runAction('avaliacao'),
                    clinical: true,
                },
                tone: 'brand',
            });
        }
        if (!stats.activeProgram) {
            list.push({
                key: 'programa',
                icon: <Sparkles />,
                title: 'Sem programa de exercícios',
                hint: 'Prescreva exercícios para casa entre as sessões.',
                action: {
                    label: 'Prescrever',
                    run: () => runAction('programa'),
                },
                tone: 'brand',
            });
        }
        if (!stats.next) {
            list.push({
                key: 'agendar',
                icon: <CalendarClock />,
                title: 'Nenhuma consulta marcada',
                hint: 'Marque o próximo atendimento.',
                action: { label: 'Agendar', run: () => runAction('consulta') },
                tone: 'warning',
            });
        }
        return list;
    }, [items, stats, onOpen, runAction, now]);

    const TABS: {
        key: string;
        label: string;
        short?: string;
        kinds: RecordKind[];
    }[] = [
        {
            key: 'clinico',
            label: 'Clínico',
            kinds: ['evolucao', 'avaliacao', 'questionario'],
        },
        {
            key: 'agenda',
            label: 'Consultas',
            short: 'Agenda',
            kinds: ['consulta'],
        },
        { key: 'programas', label: 'Programas', kinds: ['programa'] },
        { key: 'arquivos', label: 'Arquivos', kinds: ['arquivo'] },
    ];
    const current = TABS.find((t) => t.key === tab) ?? TABS[0]!;
    const tabItems = items.filter(
        (i) => current.kinds.includes(i.kind) && matchesSearch(i, search),
    );
    const clinicalError =
        listErrors.evolutions ||
        listErrors.assessments ||
        listErrors.questionnaires;
    const tabError =
        (tab === 'clinico' && clinicalError) ||
        (tab === 'agenda' && listErrors.appointments) ||
        (tab === 'programas' && listErrors.programs) ||
        (tab === 'arquivos' && listErrors.files);

    return (
        <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            {/* Faixa do paciente */}
            <div className="border-b border-ds-border-subtle bg-ds-surface-default">
                <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center">
                    {/* Celular: voltar em cima; foto e nome lado a lado; o
                        resto na largura toda. Desktop: tudo numa linha. */}
                    <button
                        type="button"
                        onClick={() => navigate('/clinica/pacientes')}
                        className="-mb-2 flex w-fit cursor-pointer items-center gap-1.5 text-ds-body-xs text-ds-content-secondary sm:hidden"
                    >
                        <ArrowLeft className="size-4" />
                        Pacientes
                    </button>
                    <div className="grid min-w-0 flex-1 grid-cols-[auto_1fr] items-center gap-x-3 gap-y-3 sm:grid-cols-[auto_auto_1fr] sm:gap-x-4 sm:gap-y-0">
                        <div className="max-sm:hidden sm:row-span-2">
                            <DsButton
                                variant="tertiary"
                                iconPosition="only"
                                icon={<ArrowLeft />}
                                label="Voltar para pacientes"
                                onClick={() => navigate('/clinica/pacientes')}
                            />
                        </div>
                        <div className="sm:row-span-2">
                            {patient ? (
                                <PatientAvatar
                                    patient={patient}
                                    size={isMobile ? 56 : 64}
                                />
                            ) : (
                                <span className="block size-14 animate-pulse rounded-ds-full bg-ds-surface-subtle sm:size-16" />
                            )}
                        </div>
                        <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                            <h1 className="text-ds-body-lg leading-tight font-semibold sm:truncate sm:text-ds-h3">
                                {shownName}
                            </h1>
                            {patient && (
                                <PatientStatusBadge status={patient.status} />
                            )}
                        </div>
                        <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-3">
                            <p className="text-ds-body-sm text-ds-content-secondary sm:mt-0.5 sm:truncate">
                                {[
                                    patient?.diagnosis,
                                    age !== null && `${age} anos`,
                                    patient?.insurance,
                                    patient?.professional &&
                                        `com ${patient.professional}`,
                                ]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                            <div className="mt-2 -ml-2 flex flex-wrap gap-1 sm:ml-0">
                                {patient?.phone && (
                                    <DsButton
                                        size="sm"
                                        variant="tertiary"
                                        iconPosition="left"
                                        icon={<Phone />}
                                        label={formatPhone(patient.phone) ?? ''}
                                        onClick={() =>
                                            window.open(`tel:${patient.phone}`)
                                        }
                                    />
                                )}
                                <HeaderWhatsApp phone={patient?.phone} />
                                <DsButton
                                    size="sm"
                                    variant="tertiary"
                                    iconPosition="left"
                                    icon={<Pencil />}
                                    label="Editar cadastro"
                                    onClick={() =>
                                        navigate(
                                            `/clinica/pacientes/${id}/editar`,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    {/* Próxima consulta */}
                    <div className="flex items-center gap-4 rounded-ds-xl bg-[image:var(--ds-gradient-brand)] p-4 text-ds-content-on-brand lg:w-96">
                        <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-ds-lg bg-ds-white/15">
                            {stats.next?.date ? (
                                <>
                                    <span className="font-ds-mono text-ds-h4 leading-none font-semibold">
                                        {stats.next.date.getDate()}
                                    </span>
                                    <span className="text-ds-micro uppercase">
                                        {stats.next.date.toLocaleDateString(
                                            'pt-BR',
                                            {
                                                month: 'short',
                                            },
                                        )}
                                    </span>
                                </>
                            ) : (
                                <CalendarX className="size-6" />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-ds-eyebrow uppercase opacity-80">
                                Próxima consulta
                            </p>
                            {stats.next?.date ? (
                                <>
                                    <p className="truncate text-ds-body-emphasis">
                                        {stats.next.title}
                                    </p>
                                    <p className="truncate text-ds-caption opacity-80">
                                        {relativeDay(stats.next.date)} às{' '}
                                        {formatTime(stats.next.date)}
                                    </p>
                                    {stats.next.author && (
                                        <p className="truncate text-ds-caption opacity-80">
                                            com {stats.next.author}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-ds-body-sm">Nada marcado</p>
                            )}
                        </div>
                        <DsTooltip content="Agendar consulta">
                            <button
                                type="button"
                                aria-label="Agendar consulta"
                                onClick={() => runAction('consulta')}
                                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-ds-full bg-ds-white/15 transition-colors hover:bg-ds-white/25 focus-visible:shadow-ds-focus focus-visible:outline-0"
                            >
                                <CalendarClock className="size-4" />
                            </button>
                        </DsTooltip>
                    </div>
                </div>
            </div>

            <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6 px-4 pt-6 pb-24 sm:px-6">
                {stats.noShowStreak >= 2 && (
                    <DsAlert
                        variant="warning"
                        mode="rich"
                        icon={<AlertTriangle />}
                        title={`${stats.noShowStreak} faltas seguidas`}
                        actions={undefined}
                    >
                        O paciente não veio às últimas consultas. Um contato
                        agora ajuda a não perder o tratamento.
                    </DsAlert>
                )}

                {/* Números: no celular, um cartão só em 2×2. */}
                {isMobile ? (
                    <MobileStats
                        loading={isLoading}
                        cells={[
                            {
                                label: 'Sessões realizadas',
                                value: String(stats.completed),
                            },
                            {
                                label: 'Comparecimento',
                                value:
                                    stats.attendance === null
                                        ? '—'
                                        : `${stats.attendance}%`,
                                hint: `${stats.noShow} ${stats.noShow === 1 ? 'falta' : 'faltas'}`,
                                warn:
                                    stats.attendance !== null &&
                                    stats.attendance < 75,
                            },
                            {
                                label: 'Em acompanhamento',
                                value:
                                    monthsInCare === null
                                        ? '—'
                                        : `${monthsInCare} ${monthsInCare === 1 ? 'mês' : 'meses'}`,
                                hint: stats.since
                                    ? `desde ${formatDate(stats.since, false)}`
                                    : undefined,
                            },
                            {
                                label: 'Última sessão',
                                value: stats.last?.date
                                    ? relativeDay(stats.last.date)
                                    : '—',
                                hint: stats.last?.title,
                            },
                        ]}
                    />
                ) : (
                    <section
                        aria-label="Resumo do tratamento"
                        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                    >
                        <DsKpi
                            label="Sessões realizadas"
                            value={stats.completed}
                            icon={<Check />}
                            loading={isLoading}
                        />
                        <DsKpi
                            label="Comparecimento"
                            value={
                                stats.attendance === null
                                    ? '—'
                                    : `${stats.attendance}%`
                            }
                            trend={
                                stats.attendance === null
                                    ? undefined
                                    : stats.attendance >= 75
                                      ? 'up'
                                      : 'down'
                            }
                            delta={`${stats.noShow} ${stats.noShow === 1 ? 'falta' : 'faltas'}`}
                            icon={<CalendarCheck />}
                            loading={isLoading}
                        />
                        <DsKpi
                            label="Em acompanhamento"
                            value={
                                monthsInCare === null
                                    ? '—'
                                    : `${monthsInCare} ${monthsInCare === 1 ? 'mês' : 'meses'}`
                            }
                            delta={
                                stats.since
                                    ? `desde ${formatDate(stats.since, true)}`
                                    : undefined
                            }
                            icon={<Clock />}
                            loading={isLoading}
                        />
                        <DsKpi
                            label="Última sessão"
                            value={
                                stats.last?.date
                                    ? relativeDay(stats.last.date)
                                    : '—'
                            }
                            delta={stats.last?.title}
                            icon={<CalendarClock />}
                            loading={isLoading}
                        />
                    </section>
                )}

                {isPhysio && (
                    <p className="text-ds-caption text-ds-content-secondary">
                        Os números e o gráfico são das suas consultas com este
                        paciente.
                    </p>
                )}

                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <AttendanceStrip
                        items={items}
                        onOpen={onOpen}
                        compact={isMobile}
                    />

                    {/* Próximos passos */}
                    <section className="flex flex-col rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
                        <h2 className="mb-1 text-ds-body-emphasis">
                            Próximos passos
                        </h2>
                        <p className="mb-3 text-ds-caption text-ds-content-muted">
                            Sugestões a partir do prontuário
                        </p>
                        {steps.length === 0 ? (
                            <p className="py-6 text-center text-ds-body-sm text-ds-content-secondary">
                                Tudo em dia.
                            </p>
                        ) : (
                            <ul className="flex flex-col divide-y divide-ds-border-subtle">
                                {steps.map((s) => (
                                    <li
                                        key={s.key}
                                        className="flex items-center gap-3 py-2.5"
                                    >
                                        <span
                                            className={dsCn(
                                                'flex size-8 shrink-0 items-center justify-center rounded-ds-full [&_svg]:size-4',
                                                s.tone === 'warning' &&
                                                    'bg-ds-status-warning-surface text-ds-status-warning-content',
                                                s.tone === 'brand' &&
                                                    'bg-ds-surface-brand-subtle text-ds-content-brand ds-dark:text-ds-primary-60',
                                            )}
                                        >
                                            {s.icon}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-ds-body-xs font-medium">
                                                {s.title}
                                            </p>
                                            <p className="line-clamp-2 text-ds-caption text-ds-content-muted">
                                                {s.hint}
                                            </p>
                                        </div>
                                        {s.action &&
                                            (s.action.clinical ? (
                                                <GuardedButton
                                                    allowed={canManageClinical}
                                                    denied={CLINICAL_DENIED}
                                                    label={s.action.label}
                                                    onClick={s.action.run}
                                                />
                                            ) : (
                                                <DsButton
                                                    size="sm"
                                                    variant="secondary"
                                                    label={s.action.label}
                                                    onClick={s.action.run}
                                                />
                                            ))}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                {/* Registros */}
                <section
                    ref={recordsSectionRef}
                    className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs"
                >
                    <div className="border-b border-ds-border-subtle p-3 sm:p-4">
                        <DsInput
                            type="search"
                            label="Pesquisar registros"
                            placeholder="Evolução, avaliação, questionário ou arquivo"
                            iconLeft={<Search />}
                            value={search}
                            onValueChange={setSearch}
                            onCleared={() => setSearch('')}
                        />
                    </div>
                    <div className="flex flex-col gap-3 border-b border-ds-border-subtle p-3 sm:flex-row sm:items-center sm:p-4">
                        <div className="min-w-0 overflow-x-auto sm:mr-auto">
                            <DsTabs
                                size="sm"
                                value={tab}
                                onValueChange={setTab}
                                tabs={TABS.map((t) => ({
                                    key: t.key,
                                    label: isMobile
                                        ? (t.short ?? t.label)
                                        : `${t.label} (${items.filter((i) => t.kinds.includes(i.kind)).length})`,
                                }))}
                            />
                        </div>
                        {isMobile ? (
                            <div className="grid grid-cols-4 gap-2">
                                {QUICK_ACTIONS.filter((a) =>
                                    RECORD_ACTIONS.includes(a.key),
                                ).map((a) => (
                                    <MobileRecordAction
                                        key={a.key}
                                        action={a}
                                        allowed={
                                            a.key === 'evolucao' ||
                                            a.key === 'avaliacao'
                                                ? canManageClinical
                                                : true
                                        }
                                        onClick={() => runAction(a.key)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {QUICK_ACTIONS.filter((a) =>
                                    RECORD_ACTIONS.includes(a.key),
                                ).map((a) => {
                                    const clinical =
                                        a.key === 'evolucao' ||
                                        a.key === 'avaliacao';
                                    if (clinical) {
                                        return (
                                            <GuardedButton
                                                key={a.key}
                                                allowed={canManageClinical}
                                                denied={CLINICAL_DENIED}
                                                label={a.label}
                                                icon={a.icon}
                                                onClick={() => runAction(a.key)}
                                            />
                                        );
                                    }
                                    return (
                                        <DsButton
                                            key={a.key}
                                            size="sm"
                                            variant="secondary"
                                            iconPosition="left"
                                            icon={a.icon}
                                            label={a.label}
                                            onClick={() => runAction(a.key)}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    {tabError ? (
                        <div className="p-4">
                            <DsAlert
                                variant="danger"
                                mode="rich"
                                title="Não foi possível carregar estes registros"
                            >
                                O restante do prontuário continua visível.
                            </DsAlert>
                        </div>
                    ) : null}
                    {tabItems.length === 0 && !tabError ? (
                        <div className="p-6">
                            <DsEmptyState
                                variant="empty"
                                title={`Nenhum registro em ${current.label.toLowerCase()}`}
                                description="Use os botões acima para registrar."
                            />
                        </div>
                    ) : null}
                    {tabItems.length === 0 ? null : current.key ===
                      'arquivos' ? (
                        <FileGrid items={tabItems} onOpen={onOpen} />
                    ) : (
                        <ul className="divide-y divide-ds-border-subtle">
                            {tabItems.map((item) => (
                                <li key={item.key}>
                                    <button
                                        type="button"
                                        onClick={() => onOpen(item)}
                                        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ds-surface-subtle focus-visible:shadow-ds-focus focus-visible:outline-0"
                                    >
                                        <KindIcon kind={item.kind} size={32} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-ds-body-xs font-medium">
                                                {item.title}
                                            </p>
                                            <p className="truncate text-ds-caption text-ds-content-muted">
                                                {item.subtitle}
                                            </p>
                                            <p className="mt-1.5 flex flex-wrap items-center gap-2 sm:hidden">
                                                <span className="font-ds-mono text-ds-caption text-ds-content-secondary">
                                                    {item.date?.toLocaleDateString(
                                                        'pt-BR',
                                                    ) ?? '—'}
                                                </span>
                                                <ToneBadge
                                                    status={item.status}
                                                />
                                            </p>
                                        </div>
                                        <div className="hidden sm:block">
                                            <ToneBadge status={item.status} />
                                        </div>
                                        <p className="hidden w-24 shrink-0 text-right font-ds-mono text-ds-caption text-ds-content-secondary sm:block">
                                            {item.date?.toLocaleDateString(
                                                'pt-BR',
                                            ) ?? '—'}
                                        </p>
                                        <ChevronRight className="size-4 shrink-0 text-ds-content-subtle" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

/** Um ponto por consulta, coluna por mês, 12 meses para trás e 2 à frente. */
function AttendanceStrip({
    items,
    onOpen,
    compact = false,
}: {
    items: RecordItem[];
    onOpen: (item: RecordItem) => void;
    /** Celular: 5 meses para trás e 1 à frente, sem rolagem lateral. */
    compact?: boolean;
}) {
    const months = useMemo(() => {
        const now = new Date();
        const list: {
            key: string;
            label: string;
            year: number;
            items: RecordItem[];
        }[] = [];
        const [first, last] = compact ? [-5, 1] : [-11, 2];
        for (let offset = first; offset <= last; offset += 1) {
            const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
            list.push({
                key: `${d.getFullYear()}-${d.getMonth()}`,
                label: d
                    .toLocaleDateString('pt-BR', { month: 'short' })
                    .replace('.', ''),
                year: d.getFullYear(),
                items: [],
            });
        }
        for (const item of items) {
            if (item.kind !== 'consulta' || !item.date) continue;
            const key = `${item.date.getFullYear()}-${item.date.getMonth()}`;
            list.find((m) => m.key === key)?.items.push(item);
        }
        for (const m of list) {
            m.items.sort((a, b) => a.date!.getTime() - b.date!.getTime());
        }
        return list;
    }, [items, compact]);
    const thisMonth = `${new Date().getFullYear()}-${new Date().getMonth()}`;

    return (
        <section className="min-w-0 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
            <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <h2 className="mr-auto text-ds-body-emphasis">Frequência</h2>
                <ul className="flex flex-wrap gap-x-3 gap-y-1 text-ds-caption text-ds-content-secondary">
                    {/* Mesmas cores e nomes da agenda (DS_STATUS). */}
                    {STATUS_ORDER.map((s) => (
                        <li key={s} className="flex items-center gap-1.5">
                            <span
                                className="size-2.5 rounded-ds-full"
                                style={{ background: DS_STATUS[s].accent }}
                            />
                            {statusLabel(s)}
                        </li>
                    ))}
                </ul>
            </div>
            <div className={compact ? undefined : 'overflow-x-auto'}>
                <div
                    className={dsCn(
                        'grid items-end gap-1',
                        !compact && 'min-w-[560px]',
                    )}
                    style={{
                        gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))`,
                    }}
                >
                    {months.map((m) => (
                        <div
                            key={m.key}
                            className="flex flex-col items-center gap-2"
                        >
                            <div
                                className={dsCn(
                                    'flex flex-col-reverse items-center justify-start gap-1.5',
                                    compact ? 'min-h-16' : 'min-h-24',
                                )}
                            >
                                {m.items.map((item) => {
                                    const a = item.source.item as Appointment;
                                    return (
                                        <DsTooltip
                                            key={item.key}
                                            content={`${formatDate(item.date, false)} · ${item.title} · ${item.status?.label}`}
                                        >
                                            <button
                                                type="button"
                                                aria-label={`${item.title}, ${formatDate(item.date)}, ${item.status?.label}`}
                                                onClick={() => onOpen(item)}
                                                className="size-3.5 cursor-pointer rounded-ds-full transition-transform hover:scale-125 focus-visible:shadow-ds-focus focus-visible:outline-0"
                                                style={{
                                                    background:
                                                        DS_STATUS[a.status]
                                                            .accent,
                                                }}
                                            />
                                        </DsTooltip>
                                    );
                                })}
                            </div>
                            <span
                                className={dsCn(
                                    'w-full rounded-ds-sm py-0.5 text-center text-ds-micro text-ds-content-muted uppercase',
                                    m.key === thisMonth &&
                                        'bg-ds-surface-brand-subtle font-semibold text-ds-content-brand ds-dark:text-ds-primary-60',
                                )}
                            >
                                {m.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function FileGrid({
    items,
    onOpen,
}: {
    items: RecordItem[];
    onOpen: (item: RecordItem) => void;
}) {
    return (
        <ul className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((item) => {
                const f =
                    item.source.kind === 'arquivo' ? item.source.item : null;
                const isImage = f?.mimeType?.startsWith('image/');
                return (
                    <li key={item.key}>
                        <button
                            type="button"
                            onClick={() => onOpen(item)}
                            className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-ds-lg border border-ds-border-subtle text-left transition-shadow hover:shadow-ds-sm focus-visible:shadow-ds-focus focus-visible:outline-0"
                        >
                            <span className="flex aspect-[4/3] items-center justify-center bg-ds-surface-subtle">
                                {isImage && f ? (
                                    <img
                                        src={f.cdnUrl}
                                        alt=""
                                        className="size-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <KindIcon kind="arquivo" size={40} />
                                )}
                            </span>
                            <span className="p-2">
                                <span className="block truncate text-ds-body-xs font-medium">
                                    {item.title}
                                </span>
                                <span className="block text-ds-caption text-ds-content-muted">
                                    {formatDate(item.date)}
                                </span>
                            </span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function HeaderWhatsApp({ phone }: { phone?: string }) {
    const url = whatsappChatUrl(phone);
    const button = (
        <DsButton
            size="sm"
            variant="tertiary"
            iconPosition="left"
            icon={<MessageCircle />}
            label="Chamar no WhatsApp"
            aria-disabled={url ? undefined : true}
            className={url ? undefined : 'cursor-not-allowed opacity-50'}
            onClick={
                url
                    ? () => window.open(url, '_blank', 'noopener,noreferrer')
                    : undefined
            }
        />
    );
    if (url) return button;
    return (
        <DsTooltip content="Paciente sem telefone cadastrado" asChild>
            {button}
        </DsTooltip>
    );
}

function MobileRecordAction({
    action,
    allowed,
    onClick,
}: {
    action: (typeof QUICK_ACTIONS)[number];
    allowed: boolean;
    onClick: () => void;
}) {
    const button = (
        <button
            type="button"
            aria-label={action.label}
            aria-disabled={allowed ? undefined : true}
            onClick={allowed ? onClick : undefined}
            className={dsCn(
                'flex cursor-pointer flex-col items-center gap-1 rounded-ds-lg border border-ds-border-subtle px-1 py-2.5 text-ds-micro text-ds-content-secondary transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0 active:bg-ds-surface-brand-subtle [&_svg]:size-5 [&_svg]:text-ds-content-brand ds-dark:[&_svg]:text-ds-primary-60',
                !allowed && 'cursor-not-allowed opacity-50',
            )}
        >
            {action.icon}
            {action.short}
        </button>
    );
    if (allowed) return button;
    return (
        <DsTooltip content={CLINICAL_DENIED} asChild>
            {button}
        </DsTooltip>
    );
}

/** Os quatro números num cartão só, para o celular. */
function MobileStats({
    cells,
    loading,
}: {
    cells: { label: string; value: string; hint?: string; warn?: boolean }[];
    loading: boolean;
}) {
    return (
        <section
            aria-label="Resumo do tratamento"
            className="grid grid-cols-2 overflow-hidden rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs"
        >
            {cells.map((c, i) => (
                <div
                    key={c.label}
                    className={dsCn(
                        'flex min-w-0 flex-col gap-0.5 p-3',
                        i % 2 === 0 && 'border-r border-ds-border-subtle',
                        i < 2 && 'border-b border-ds-border-subtle',
                    )}
                >
                    <span className="text-ds-caption text-ds-content-muted">
                        {c.label}
                    </span>
                    {loading ? (
                        <span className="my-1 h-6 w-16 animate-pulse rounded-ds-sm bg-ds-surface-subtle" />
                    ) : (
                        <span className="text-ds-h4 leading-tight font-semibold">
                            {c.value}
                        </span>
                    )}
                    {c.hint && !loading && (
                        <span
                            className={dsCn(
                                'truncate text-ds-caption text-ds-content-secondary',
                                c.warn && 'text-ds-content-danger',
                            )}
                        >
                            {c.hint}
                        </span>
                    )}
                </div>
            ))}
        </section>
    );
}
