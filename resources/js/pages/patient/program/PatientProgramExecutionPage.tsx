import type { LucideIcon } from 'lucide-react';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Dumbbell,
    Flame,
    Info,
    Layers,
    ListChecks,
    Loader2,
    Play,
    Plus,
    Repeat,
    SkipForward,
    Stethoscope,
    Timer,
    VideoOff,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
    patientProgramFeedbackPath,
    patientProgramsListPath,
} from '@/application/patient/patient-program-paths';
import {
    useCompleteProgram,
    usePatientProgram,
    useSaveProgramSeries,
    useStartOrResumeExecution,
} from '@/application/patient/use-patient-program';
import { DsBadge } from '@/components/ds/badge/DsBadge';
import { DsButton } from '@/components/ds/button/DsButton';
import { DsEmptyState } from '@/components/ds/empty-state/DsEmptyState';
import { DsPatientNavbar } from '@/components/ds/navbar/DsPatientNavbar';
import { dsCn } from '@/components/ds/utils/ds-cn';

interface ExecutionMetricItem {
    icon: LucideIcon;
    label: string;
    value: string;
    unit?: string;
}

function formatRange(min?: number, max?: number): string | null {
    if (min == null && max == null) return null;
    if (min != null && max != null && min !== max) return `${min}–${max}`;
    return String(min ?? max);
}

export default function PatientProgramExecutionPage() {
    const { clinicSlug = '', publicToken = '' } = useParams<{
        clinicSlug: string;
        publicToken: string;
    }>();
    const [searchParams] = useSearchParams();
    const startAt = searchParams.get('startAt');
    const navigate = useNavigate();

    const {
        data: program,
        isLoading,
        isError,
    } = usePatientProgram(publicToken || '');
    const { mutateAsync: startExecution } = useStartOrResumeExecution();
    const { mutateAsync: saveSeries } = useSaveProgramSeries();
    const { mutateAsync: completeProgram, isPending: isCompleting } =
        useCompleteProgram();

    const [executionId, setExecutionId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSeries, setCurrentSeries] = useState(1);
    const [load, setLoad] = useState('');
    const [indexInitialized, setIndexInitialized] = useState(false);
    const [mobileTrackOpen, setMobileTrackOpen] = useState(false);

    // Optional interactive rest timer state
    const [restSecondsRemaining, setRestSecondsRemaining] = useState<
        number | null
    >(null);
    const [restTotalSeconds, setRestTotalSeconds] = useState(30);

    useEffect(() => {
        if (restSecondsRemaining === null || restSecondsRemaining <= 0) {
            return;
        }
        const interval = window.setInterval(() => {
            setRestSecondsRemaining((prev) => {
                if (prev === null || prev <= 1) return null;
                return prev - 1;
            });
        }, 1000);
        return () => window.clearInterval(interval);
    }, [restSecondsRemaining]);

    const exercises = useMemo(
        () => program?.groups.flatMap((g) => g.exercises) ?? [],
        [program],
    );

    if (program && !indexInitialized && exercises.length > 0) {
        setIndexInitialized(true);
        if (startAt) {
            const idx = exercises.findIndex((e) => e.id === startAt);
            if (idx !== -1) setCurrentIndex(idx);
        }
        if (program.currentExecutionId) {
            setExecutionId(program.currentExecutionId);
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-ds-surface-body p-6 text-center font-ds text-ds-content-secondary">
                <Loader2 className="size-8 animate-spin text-ds-primary-80 ds-dark:text-ds-primary-40" />
                <p className="text-ds-body-sm">Preparando sua sessão…</p>
            </div>
        );
    }

    if (isError || !program) {
        return (
            <div className="flex h-full w-full flex-col bg-ds-surface-body font-ds text-ds-content-primary">
                <DsPatientNavbar />
                <div className="flex flex-1 items-center justify-center p-6">
                    <DsEmptyState
                        icon={<AlertCircle className="size-6" />}
                        title="Não foi possível carregar a sessão"
                        description="Verifique sua conexão e tente novamente."
                        action={
                            <DsButton
                                variant="primary"
                                label="Tentar de novo"
                                onClick={() => navigate(0)}
                            />
                        }
                    />
                </div>
            </div>
        );
    }

    if (exercises.length === 0) {
        return (
            <div className="flex h-full w-full flex-col bg-ds-surface-body font-ds text-ds-content-primary">
                <DsPatientNavbar
                    title={program.name}
                    onBack={() => navigate(-1)}
                />
                <div className="flex flex-1 items-center justify-center p-6">
                    <DsEmptyState
                        icon={<Activity className="size-6" />}
                        title="Nenhum exercício nesta sessão"
                        description="Este programa ainda não tem exercícios para executar."
                        action={
                            <DsButton
                                variant="secondary"
                                label="Voltar aos programas"
                                onClick={() =>
                                    navigate(
                                        patientProgramsListPath(
                                            clinicSlug ||
                                                program.clinicSlug ||
                                                '',
                                        ),
                                    )
                                }
                            />
                        }
                    />
                </div>
            </div>
        );
    }

    const exercise = exercises[currentIndex];
    const prescription = exercise.prescription;
    const totalSeries = prescription.seriesMax || prescription.seriesMin || 1;
    const groupName =
        program.groups.find((g) =>
            g.exercises.some((e) => e.id === exercise.id),
        )?.name || '';
    const isLastExercise = currentIndex === exercises.length - 1;
    const isLastSeries = currentSeries >= totalSeries;

    const repsRange = formatRange(
        prescription.repetitionsMin,
        prescription.repetitionsMax,
    );
    const durationRange = formatRange(
        prescription.durationMin,
        prescription.durationMax,
    );
    const showLoadInput = prescription.loadMin !== undefined;

    const metrics: ExecutionMetricItem[] = [
        {
            icon: Layers,
            label: 'Séries',
            value:
                formatRange(prescription.seriesMin, prescription.seriesMax) ??
                '1',
        },
    ];
    if (repsRange) {
        metrics.push({
            icon: Repeat,
            label: 'Repetições',
            value: repsRange,
        });
    } else if (durationRange) {
        metrics.push({
            icon: Clock,
            label: 'Duração',
            value: durationRange,
            unit: 's',
        });
    }
    if (prescription.restTime) {
        metrics.push({
            icon: Timer,
            label: 'Descanso',
            value: String(prescription.restTime),
            unit: 's',
        });
    }
    if (prescription.intensity) {
        metrics.push({
            icon: Flame,
            label: 'Intensidade',
            value: prescription.intensity,
        });
    }

    const scheduleParts = [
        exercise.days?.join(', '),
        exercise.period?.join(', '),
    ].filter(Boolean) as string[];

    const ensureExecutionId = async (): Promise<string | null> => {
        if (executionId) return executionId;
        if (!publicToken) return null;
        try {
            const res = await startExecution(publicToken);
            setExecutionId(res.id);
            return res.id;
        } catch {
            return null;
        }
    };

    const persistCurrentSeries = async () => {
        if (!publicToken) return;
        const id = await ensureExecutionId();
        if (!id) return;
        const isBodyweight = !load;
        try {
            await saveSeries({
                publicToken,
                executionId: id,
                exerciseId: exercise.id,
                series: [
                    {
                        count:
                            prescription.repetitionsMin ??
                            prescription.repetitionsMax,
                        weightValue: isBodyweight ? undefined : load,
                        weightUnit: 'kg',
                        isBodyweight,
                    },
                ],
            });
        } catch {
            // Uma série que não salvou não pode travar a sessão do paciente.
        }
    };

    const handleStartRestTimer = (seconds: number) => {
        setRestTotalSeconds(seconds);
        setRestSecondsRemaining(seconds);
    };

    const handleSkipRestTimer = () => {
        setRestSecondsRemaining(null);
    };

    const handleAddRestSeconds = (extra: number) => {
        setRestSecondsRemaining((prev) => (prev ?? 0) + extra);
        setRestTotalSeconds((prev) => prev + extra);
    };

    const handleNextSeries = async () => {
        await persistCurrentSeries();
        if (currentSeries < totalSeries) {
            setCurrentSeries((prev) => prev + 1);
            setLoad('');
            if (prescription.restTime && prescription.restTime > 0) {
                handleStartRestTimer(prescription.restTime);
            }
        } else if (currentIndex < exercises.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setCurrentSeries(1);
            setLoad('');
            setRestSecondsRemaining(null);
        } else {
            const slug = clinicSlug || program.clinicSlug || '';
            if (!slug || !publicToken) return;

            const id = await ensureExecutionId();

            try {
                await completeProgram(publicToken);
                navigate(patientProgramFeedbackPath(slug, publicToken), {
                    state: {
                        completed: true,
                        executionId: id ?? undefined,
                    },
                });
            } catch {
                // Fica na tela para o paciente tentar finalizar de novo.
            }
        }
    };

    const handlePrevious = () => {
        setRestSecondsRemaining(null);
        if (currentSeries > 1) {
            setCurrentSeries((prev) => prev - 1);
        } else if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
            const prevExercise = exercises[currentIndex - 1];
            setCurrentSeries(
                prevExercise.prescription.seriesMax ||
                    prevExercise.prescription.seriesMin ||
                    1,
            );
        } else {
            navigate(-1);
        }
    };

    const handleSelectExerciseIndex = (idx: number) => {
        if (idx < 0 || idx >= exercises.length) return;
        setCurrentIndex(idx);
        setCurrentSeries(1);
        setLoad('');
        setRestSecondsRemaining(null);
        setMobileTrackOpen(false);
    };

    const handleSelectSeries = (seriesNumber: number) => {
        if (seriesNumber < 1 || seriesNumber > totalSeries) return;
        setCurrentSeries(seriesNumber);
    };

    const primaryLabel = !isLastSeries
        ? 'Concluir série'
        : !isLastExercise
          ? 'Próximo exercício'
          : 'Finalizar programa';

    const restConfigured = exercise.prescription.restTime ?? 30;
    const isResting = restSecondsRemaining !== null && restSecondsRemaining > 0;
    const restProgressPct =
        isResting && restTotalSeconds > 0
            ? Math.round(
                  ((restTotalSeconds - restSecondsRemaining) /
                      restTotalSeconds) *
                      100,
              )
            : 0;
    const sessionProgressPct = Math.round(
        ((currentIndex + (currentSeries - 1) / Math.max(totalSeries, 1)) /
            Math.max(exercises.length, 1)) *
            100,
    );

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <DsPatientNavbar
                title={program.name}
                current={currentIndex + 1}
                total={exercises.length}
                onBack={() => navigate(-1)}
            />

            <div className="flex flex-1 flex-col justify-between">
                <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:py-8">
                    {/* Exercise Stepper Card (Desktop + Mobile responsive) */}
                    <section
                        aria-label="Navegação de exercícios da sessão"
                        className="mb-5 rounded-ds-2xl border border-ds-border-default bg-ds-surface-default p-3.5 shadow-ds-xs sm:mb-6 sm:p-4"
                    >
                        {/* Stepper Header */}
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex size-6 items-center justify-center rounded-ds-md bg-ds-primary-10 text-ds-primary-80 ds-dark:bg-ds-surface-brand-subtle ds-dark:text-ds-primary-40">
                                    <ListChecks className="size-3.5" />
                                </span>
                                <span className="text-ds-body-xs font-semibold text-ds-content-primary">
                                    Trilha da sessão
                                </span>
                                <DsBadge variant="default">
                                    {currentIndex + 1} de {exercises.length}
                                </DsBadge>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="hidden font-ds-mono text-ds-caption text-ds-content-muted sm:inline">
                                    {currentIndex} concluído
                                    {currentIndex === 1 ? '' : 's'} ·{' '}
                                    {sessionProgressPct}%
                                </span>

                                {/* Mobile toggle button to expand exercise names */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setMobileTrackOpen((prev) => !prev)
                                    }
                                    className="inline-flex cursor-pointer items-center gap-1 rounded-ds-md border border-ds-border-default bg-ds-surface-subtle px-2.5 py-1 text-ds-caption font-semibold text-ds-content-secondary sm:hidden"
                                >
                                    <span>
                                        {mobileTrackOpen
                                            ? 'Ocultar lista'
                                            : 'Ver lista'}
                                    </span>
                                    {mobileTrackOpen ? (
                                        <ChevronUp className="size-3.5" />
                                    ) : (
                                        <ChevronDown className="size-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Thin overall session progress bar */}
                        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-ds-full bg-ds-surface-subtle">
                            <div
                                className="h-full rounded-ds-full bg-ds-primary-80 transition-all duration-300 ds-dark:bg-ds-primary-60"
                                style={{
                                    width: `${Math.max(sessionProgressPct, 6)}%`,
                                }}
                            />
                        </div>

                        {/* Mobile compact number buttons (always visible on mobile, no horizontal cutoff) */}
                        <div className="mt-3 sm:hidden">
                            <div className="flex flex-wrap items-center gap-1.5">
                                {exercises.map((item, idx) => {
                                    const done = idx < currentIndex;
                                    const active = idx === currentIndex;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() =>
                                                handleSelectExerciseIndex(idx)
                                            }
                                            aria-label={`Exercício ${idx + 1}: ${item.name}${done ? ' (concluído)' : active ? ' (atual)' : ''}`}
                                            className={dsCn(
                                                'flex h-9 min-w-[36px] flex-1 cursor-pointer items-center justify-center gap-1 rounded-ds-lg border px-2 font-ds-mono text-ds-caption font-bold transition-all',
                                                active &&
                                                    'border-ds-primary-80 bg-ds-primary-80 text-ds-white shadow-ds-xs ds-dark:border-ds-primary-60 ds-dark:bg-ds-primary-70',
                                                done &&
                                                    !active &&
                                                    'border-ds-status-success-border bg-ds-status-success-surface text-ds-status-success-content',
                                                !done &&
                                                    !active &&
                                                    'border-ds-border-default bg-ds-surface-subtle text-ds-content-muted',
                                            )}
                                        >
                                            {done ? (
                                                <Check className="size-3.5 stroke-[2.5]" />
                                            ) : (
                                                <span>{idx + 1}</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Collapsible full list on mobile */}
                            {mobileTrackOpen && (
                                <div className="mt-3 divide-y divide-ds-border-subtle overflow-hidden rounded-ds-xl border border-ds-border-default bg-ds-surface-subtle/50">
                                    {exercises.map((item, idx) => {
                                        const done = idx < currentIndex;
                                        const active = idx === currentIndex;
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() =>
                                                    handleSelectExerciseIndex(
                                                        idx,
                                                    )
                                                }
                                                className={dsCn(
                                                    'flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition-colors',
                                                    active &&
                                                        'bg-ds-primary-10/80 ds-dark:bg-ds-surface-brand-subtle',
                                                )}
                                            >
                                                <span
                                                    className={dsCn(
                                                        'flex size-6 shrink-0 items-center justify-center rounded-ds-full font-ds-mono text-[11px] font-bold',
                                                        active &&
                                                            'bg-ds-primary-80 text-ds-white',
                                                        done &&
                                                            !active &&
                                                            'bg-ds-success-100 text-ds-white',
                                                        !done &&
                                                            !active &&
                                                            'border border-ds-border-default bg-ds-surface-default text-ds-content-muted',
                                                    )}
                                                >
                                                    {done ? (
                                                        <Check className="size-3.5 stroke-[2.5]" />
                                                    ) : (
                                                        idx + 1
                                                    )}
                                                </span>
                                                <span
                                                    className={dsCn(
                                                        'min-w-0 flex-1 truncate text-ds-body-xs',
                                                        active
                                                            ? 'font-semibold text-ds-content-primary'
                                                            : done
                                                              ? 'font-medium text-ds-status-success-content'
                                                              : 'text-ds-content-secondary',
                                                    )}
                                                >
                                                    {item.name}
                                                </span>
                                                {done && (
                                                    <span className="text-[11px] font-semibold text-ds-status-success-content">
                                                        Feito
                                                    </span>
                                                )}
                                                {active && (
                                                    <span className="text-[11px] font-semibold text-ds-primary-80 ds-dark:text-ds-primary-40">
                                                        Agora
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Desktop wrapped exercise pills (all visible, never clipped on the right) */}
                        <div className="mt-3 hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                            {exercises.map((item, idx) => {
                                const done = idx < currentIndex;
                                const active = idx === currentIndex;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            handleSelectExerciseIndex(idx)
                                        }
                                        className={dsCn(
                                            'group flex cursor-pointer items-center gap-2 rounded-ds-pill border px-3 py-1.5 text-left text-ds-caption transition-all',
                                            active &&
                                                'border-ds-primary-80 bg-ds-primary-80 text-ds-white shadow-ds-xs ds-dark:border-ds-primary-60 ds-dark:bg-ds-primary-70',
                                            done &&
                                                !active &&
                                                'border-ds-status-success-border bg-ds-status-success-surface text-ds-status-success-content hover:border-ds-success-80',
                                            !done &&
                                                !active &&
                                                'border-ds-border-default bg-ds-surface-subtle/70 text-ds-content-secondary hover:border-ds-border-strong hover:bg-ds-surface-subtle hover:text-ds-content-primary',
                                        )}
                                    >
                                        <span
                                            className={dsCn(
                                                'flex size-5 shrink-0 items-center justify-center rounded-ds-full font-ds-mono text-[11px] font-bold',
                                                active &&
                                                    'bg-ds-white text-ds-primary-100',
                                                done &&
                                                    !active &&
                                                    'bg-ds-success-100 text-ds-white',
                                                !done &&
                                                    !active &&
                                                    'border border-ds-border-default bg-ds-surface-default text-ds-content-muted',
                                            )}
                                        >
                                            {done ? (
                                                <Check className="size-3 stroke-[2.5]" />
                                            ) : (
                                                idx + 1
                                            )}
                                        </span>
                                        <span className="max-w-[200px] truncate font-medium">
                                            {item.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Split Studio Grid */}
                    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-8">
                        {/* Left: Square 1:1 Instagram-style Video Stage */}
                        <div className="w-full lg:sticky lg:top-24 lg:col-span-5">
                            <div className="w-full overflow-hidden rounded-ds-2xl border border-ds-border-default bg-ds-surface-default p-3.5 shadow-ds-md">
                                <div className="mb-2.5 flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block size-2 rounded-ds-full bg-ds-success-80" />
                                        <span className="font-ds-mono text-ds-caption font-semibold tracking-wider text-ds-content-secondary uppercase">
                                            Exercício {currentIndex + 1} de{' '}
                                            {exercises.length}
                                        </span>
                                    </div>
                                    <DsBadge variant="primary">
                                        Série {currentSeries}/{totalSeries}
                                    </DsBadge>
                                </div>

                                {/* 1:1 Square Player */}
                                <div className="relative aspect-square w-full overflow-hidden rounded-ds-xl border border-ds-border-subtle bg-ds-gray-100">
                                    {exercise.videoUrl ? (
                                        <iframe
                                            title={exercise.name}
                                            src={exercise.videoUrl}
                                            className="absolute inset-0 size-full border-0"
                                            allow="fullscreen; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ds-surface-subtle text-ds-content-muted">
                                            <VideoOff className="size-8 stroke-[1.5]" />
                                            <p className="text-ds-body-xs">
                                                Vídeo demonstrativo indisponível
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Metric Strip under square video */}
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {metrics.map((m) => {
                                        const Icon = m.icon;
                                        return (
                                            <div
                                                key={m.label}
                                                className="rounded-ds-lg border border-ds-border-subtle bg-ds-surface-subtle/60 px-3 py-2"
                                            >
                                                <div className="flex items-center gap-1 text-ds-content-muted">
                                                    <Icon className="size-3.5" />
                                                    <span className="text-[10px] font-semibold tracking-wider uppercase">
                                                        {m.label}
                                                    </span>
                                                </div>
                                                <p className="mt-0.5 font-ds-mono text-ds-body-md font-bold text-ds-content-primary">
                                                    {m.value}
                                                    {m.unit && (
                                                        <span className="ml-0.5 text-ds-caption font-normal text-ds-content-muted">
                                                            {m.unit}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Right: Command Deck & Live Series Cards */}
                        <div className="w-full space-y-4 sm:space-y-5 lg:col-span-7">
                            {/* Header Card */}
                            <div className="rounded-ds-2xl border border-ds-border-default bg-ds-surface-default p-4 shadow-ds-xs sm:p-5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DsBadge variant="info">
                                        {groupName || 'Prescrição'}
                                    </DsBadge>
                                    {scheduleParts.length > 0 && (
                                        <span className="text-ds-caption text-ds-content-muted">
                                            {scheduleParts.join(' · ')}
                                        </span>
                                    )}
                                </div>
                                <h1 className="mt-2 font-ds text-ds-h4 font-bold tracking-tight text-ds-content-primary sm:text-ds-h3">
                                    {exercise.name}
                                </h1>
                            </div>

                            {/* Interactive Rest Timer Banner */}
                            {isResting ? (
                                <div className="rounded-ds-2xl border border-ds-status-info-border bg-ds-status-info-surface p-4 shadow-ds-xs">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-11 items-center justify-center rounded-ds-xl bg-ds-primary-80 font-ds-mono text-ds-body-md font-bold text-ds-white ds-dark:bg-ds-primary-60">
                                                {restSecondsRemaining}s
                                            </div>
                                            <div>
                                                <p className="text-ds-body-xs font-semibold text-ds-content-primary">
                                                    Tempo de descanso ativo
                                                </p>
                                                <p className="text-ds-caption text-ds-content-secondary">
                                                    Respire fundo antes da
                                                    próxima série
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <DsButton
                                                variant="secondary"
                                                size="sm"
                                                iconPosition="left"
                                                icon={
                                                    <Plus className="size-3.5" />
                                                }
                                                label="15s"
                                                onClick={() =>
                                                    handleAddRestSeconds(15)
                                                }
                                            />
                                            <DsButton
                                                variant="tertiary"
                                                size="sm"
                                                iconPosition="left"
                                                icon={
                                                    <SkipForward className="size-3.5" />
                                                }
                                                label="Pular"
                                                onClick={handleSkipRestTimer}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-ds-full bg-ds-surface-default/60">
                                        <div
                                            className="h-full rounded-ds-full bg-ds-primary-80 transition-all duration-300 ds-dark:bg-ds-primary-60"
                                            style={{
                                                width: `${restProgressPct}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default px-4 py-3">
                                    <div className="flex items-center gap-2.5 text-ds-content-secondary">
                                        <Timer className="size-4 shrink-0 text-ds-primary-80 ds-dark:text-ds-primary-40" />
                                        <span className="text-ds-body-xs">
                                            Intervalo recomendado entre séries:{' '}
                                            <strong className="font-ds-mono text-ds-content-primary">
                                                {restConfigured}s
                                            </strong>
                                        </span>
                                    </div>
                                    <DsButton
                                        variant="secondary"
                                        size="sm"
                                        iconPosition="left"
                                        icon={<Play className="size-3.5" />}
                                        label={`Timer ${restConfigured}s`}
                                        onClick={() =>
                                            handleStartRestTimer(restConfigured)
                                        }
                                    />
                                </div>
                            )}

                            {/* Interactive Series Deck */}
                            <div className="rounded-ds-2xl border border-ds-border-default bg-ds-surface-default p-4 shadow-ds-xs sm:p-5">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-ds-body-sm font-semibold text-ds-content-primary">
                                        Controle de séries
                                    </h2>
                                    <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                                        {Math.min(currentSeries, totalSeries)}{' '}
                                        de {totalSeries} séries
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                                    {Array.from({ length: totalSeries }).map(
                                        (_, idx) => {
                                            const seriesNum = idx + 1;
                                            const isDone =
                                                seriesNum < currentSeries;
                                            const isCurrent =
                                                seriesNum === currentSeries;
                                            return (
                                                <button
                                                    key={seriesNum}
                                                    type="button"
                                                    onClick={() =>
                                                        handleSelectSeries(
                                                            seriesNum,
                                                        )
                                                    }
                                                    className={dsCn(
                                                        'flex cursor-pointer flex-col justify-between rounded-ds-xl border p-3.5 text-left transition-all',
                                                        isDone &&
                                                            'border-ds-status-success-border bg-ds-status-success-surface text-ds-status-success-content',
                                                        isCurrent &&
                                                            'border-ds-primary-80 bg-ds-primary-10/60 ring-2 ring-ds-primary-80/15 ds-dark:border-ds-primary-60 ds-dark:bg-ds-surface-brand-subtle',
                                                        !isDone &&
                                                            !isCurrent &&
                                                            'border-ds-border-subtle bg-ds-surface-subtle/50 text-ds-content-muted hover:border-ds-border-default',
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-ds-mono text-ds-caption font-bold uppercase">
                                                            {seriesNum}ª Série
                                                        </span>
                                                        {isDone ? (
                                                            <CheckCircle2 className="size-4 text-ds-status-success-content" />
                                                        ) : isCurrent ? (
                                                            <span className="inline-block size-2.5 rounded-ds-full bg-ds-primary-80 ds-dark:bg-ds-primary-40" />
                                                        ) : null}
                                                    </div>
                                                    <p className="mt-2 text-ds-caption font-medium">
                                                        {isDone
                                                            ? 'Concluída'
                                                            : isCurrent
                                                              ? 'Em execução agora'
                                                              : 'Aguardando'}
                                                    </p>
                                                </button>
                                            );
                                        },
                                    )}
                                </div>

                                {showLoadInput && (
                                    <div className="mt-4 border-t border-ds-border-subtle pt-4">
                                        <label
                                            htmlFor="load"
                                            className="flex items-center gap-1.5 text-ds-caption font-semibold text-ds-content-secondary"
                                        >
                                            <Dumbbell className="size-3.5" />
                                            Carga utilizada nesta série (kg)
                                        </label>
                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                            <input
                                                id="load"
                                                type="number"
                                                inputMode="decimal"
                                                value={load}
                                                onChange={(e) =>
                                                    setLoad(e.target.value)
                                                }
                                                placeholder={String(
                                                    exercise.prescription
                                                        .loadMin ??
                                                        'Peso corporal',
                                                )}
                                                className="h-10 w-36 rounded-ds-md border border-ds-border-default bg-ds-surface-default px-3 font-ds-mono text-ds-body-sm text-ds-content-primary focus:border-ds-primary-80 focus:outline-none"
                                            />
                                            {[
                                                'Peso corporal',
                                                '2',
                                                '5',
                                                '10',
                                            ].map((preset) => (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() =>
                                                        setLoad(
                                                            preset ===
                                                                'Peso corporal'
                                                                ? ''
                                                                : preset,
                                                        )
                                                    }
                                                    className="cursor-pointer rounded-ds-md border border-ds-border-default bg-ds-surface-subtle px-2.5 py-1.5 text-ds-caption font-medium text-ds-content-secondary hover:border-ds-border-strong hover:text-ds-content-primary"
                                                >
                                                    {preset === 'Peso corporal'
                                                        ? preset
                                                        : `${preset} kg`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Clinical Guidance & Description */}
                            {(exercise.notes || exercise.description) && (
                                <div className="space-y-3 rounded-ds-2xl border border-ds-border-default bg-ds-surface-default p-4 shadow-ds-xs sm:p-5">
                                    {exercise.notes && (
                                        <div className="rounded-ds-xl border border-ds-status-warning-border bg-ds-status-warning-surface p-3.5">
                                            <div className="flex items-center gap-2 text-ds-caption font-semibold text-ds-status-warning-content">
                                                <Stethoscope className="size-4 shrink-0" />
                                                Orientações do fisioterapeuta
                                            </div>
                                            <p className="mt-1.5 text-ds-body-xs leading-relaxed whitespace-pre-wrap text-ds-content-primary">
                                                {exercise.notes}
                                            </p>
                                        </div>
                                    )}
                                    {exercise.description && (
                                        <div>
                                            <div className="flex items-center gap-1.5 text-ds-caption font-semibold text-ds-content-secondary">
                                                <Info className="size-3.5" />
                                                Como executar o movimento
                                            </div>
                                            <p className="mt-1 text-ds-body-xs leading-relaxed whitespace-pre-wrap text-ds-content-secondary">
                                                {exercise.description}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Sticky Action Bar */}
                <div className="sticky bottom-0 z-20 border-t border-ds-border-default bg-ds-surface-default/95 backdrop-blur-md">
                    <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2.5 px-4 py-3 sm:gap-3 sm:px-6 sm:py-3.5">
                        <DsButton
                            variant="secondary"
                            size="lg"
                            iconPosition="left"
                            icon={<ArrowLeft className="size-4" />}
                            label="Anterior"
                            onClick={handlePrevious}
                        />

                        <div className="hidden items-center gap-2 text-ds-caption text-ds-content-muted sm:flex">
                            <span>
                                Exercício{' '}
                                <strong className="font-ds-mono text-ds-content-primary">
                                    {currentIndex + 1}/{exercises.length}
                                </strong>
                            </span>
                            <span>·</span>
                            <span>
                                Série{' '}
                                <strong className="font-ds-mono text-ds-content-primary">
                                    {currentSeries}/{totalSeries}
                                </strong>
                            </span>
                        </div>

                        <DsButton
                            variant="primary"
                            size="lg"
                            iconPosition="right"
                            icon={
                                isCompleting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <ArrowRight className="size-4" />
                                )
                            }
                            label={
                                isCompleting
                                    ? 'Finalizando…'
                                    : !isLastSeries
                                      ? `${primaryLabel} (${currentSeries}/${totalSeries})`
                                      : !isLastExercise
                                        ? 'Próximo exercício'
                                        : 'Finalizar programa'
                            }
                            disabled={isCompleting}
                            onClick={() => void handleNextSeries()}
                            className="flex-1 sm:min-w-[220px] sm:flex-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
