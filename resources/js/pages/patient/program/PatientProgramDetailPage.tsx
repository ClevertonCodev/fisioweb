import {
    Activity,
    ArrowLeft,
    Calendar,
    Check,
    CheckCircle2,
    Eye,
    Loader2,
    Play,
    RotateCcw,
    Sparkles,
    UserCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { formatPatientProgramDate } from '@/application/patient/patient-program-dates';
import {
    patientExerciseDetailPath,
    patientProgramExecutePath,
    patientProgramFeedbackPath,
    patientProgramsListPath,
} from '@/application/patient/patient-program-paths';
import {
    usePatientProgram,
    useRegisterProgramView,
} from '@/application/patient/use-patient-program';
import {
    DsBadge,
    DsButton,
    DsDrawer,
    DsEmptyState,
    DsPatientNavbar,
    dsCn,
} from '@/components/ds';
import { VideoThumb } from '@/components/VideoThumb';
import { PatientExercise } from '@/domain/patient/program';

interface DoseMetric {
    key: string;
    label: string;
    value: string;
    unit: string;
}

function extractDoseMetrics(exercise: PatientExercise): DoseMetric[] {
    const p = exercise.prescription;
    const metrics: DoseMetric[] = [];

    if (p.seriesMin) {
        const val =
            p.seriesMax && p.seriesMax !== p.seriesMin
                ? `${p.seriesMin}–${p.seriesMax}`
                : `${p.seriesMin}`;
        metrics.push({
            key: 'series',
            label: 'Séries',
            value: val,
            unit:
                Number(p.seriesMin) === 1 && !p.seriesMax ? 'série' : 'séries',
        });
    }

    if (p.repetitionsMin) {
        const val =
            p.repetitionsMax && p.repetitionsMax !== p.repetitionsMin
                ? `${p.repetitionsMin}–${p.repetitionsMax}`
                : `${p.repetitionsMin}`;
        metrics.push({
            key: 'reps',
            label: 'Repetições',
            value: val,
            unit: 'reps',
        });
    }

    if (p.loadMin) {
        const val =
            p.loadMax && p.loadMax !== p.loadMin
                ? `${p.loadMin}–${p.loadMax}`
                : `${p.loadMin}`;
        metrics.push({
            key: 'load',
            label: 'Carga',
            value: val,
            unit: 'kg',
        });
    }

    if (p.maintainFor) {
        metrics.push({
            key: 'hold',
            label: 'Sustentar',
            value: `${p.maintainFor}`,
            unit: 'seg',
        });
    }

    if (p.restTime) {
        metrics.push({
            key: 'rest',
            label: 'Descanso',
            value: `${p.restTime}`,
            unit: 'seg',
        });
    }

    if (exercise.period?.length) {
        metrics.push({
            key: 'period',
            label: 'Período',
            value: exercise.period.join(' / '),
            unit: exercise.days?.length ? exercise.days.join(', ') : 'diário',
        });
    }

    return metrics;
}

function formatDateRange(start?: string, end?: string): string {
    return `${formatPatientProgramDate(start)} – ${formatPatientProgramDate(end)}`;
}

function formatCrefito(reg?: string): string | null {
    if (!reg || !/[A-Za-zÀ-ÿ]/u.test(reg)) return null;
    return `CREFITO ${reg}`;
}

function cleanNotes(notes?: string): string | null {
    if (!notes) return null;
    return notes.replace(/^Descrição:\s*/i, '').trim() || null;
}

function targetSeriesCount(exercise: PatientExercise): number {
    return Math.max(
        1,
        exercise.prescription.seriesMax ?? exercise.prescription.seriesMin ?? 3,
    );
}

export default function PatientProgramDetailPage() {
    const { clinicSlug: paramSlug, publicToken = '' } = useParams<{
        clinicSlug: string;
        publicToken: string;
    }>();
    const navigate = useNavigate();

    const {
        data: program,
        isLoading,
        isError,
    } = usePatientProgram(publicToken);
    const { mutate: registerView } = useRegisterProgramView();

    const clinicSlug = paramSlug || program?.clinicSlug || '';

    const [doneSeriesByExercise, setDoneSeriesByExercise] = useState<
        Record<string, number>
    >({});
    const [previewExercise, setPreviewExercise] =
        useState<PatientExercise | null>(null);

    useEffect(() => {
        if (publicToken && program) {
            registerView(publicToken);
        }
    }, [publicToken, program, registerView]);

    useEffect(() => {
        if (!program?.clinicSlug || !publicToken) return;
        if (paramSlug && paramSlug !== program.clinicSlug) {
            navigate(
                `/${program.clinicSlug}/paciente/programas/${publicToken}`,
                { replace: true },
            );
        }
    }, [program?.clinicSlug, paramSlug, publicToken, navigate]);

    const allExercises = useMemo(
        () => (program ? program.groups.flatMap((g) => g.exercises) : []),
        [program],
    );

    const completedCount = useMemo(
        () =>
            allExercises.filter(
                (ex) =>
                    (doneSeriesByExercise[ex.id] ?? 0) >= targetSeriesCount(ex),
            ).length,
        [allExercises, doneSeriesByExercise],
    );

    const listPath = clinicSlug ? patientProgramsListPath(clinicSlug) : '/';

    if (!publicToken) {
        return (
            <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <DsPatientNavbar hideAuthAction />
                <div className="flex flex-1 items-center justify-center p-6">
                    <DsEmptyState
                        variant="error"
                        title="Programa não informado"
                        description="ID do programa não fornecido."
                        action={
                            <DsButton
                                variant="primary"
                                label="Voltar"
                                onClick={() => navigate(listPath)}
                            />
                        }
                    />
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 overflow-y-auto bg-ds-surface-body p-6 text-center font-ds text-ds-content-muted">
                <Loader2 className="size-8 animate-spin text-ds-content-brand" />
                <p className="text-ds-body-xs">Carregando programa…</p>
            </div>
        );
    }

    if (isError || !program) {
        return (
            <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <DsPatientNavbar hideAuthAction />
                <div className="flex flex-1 items-center justify-center p-6">
                    <DsEmptyState
                        variant="error"
                        icon={<Activity />}
                        title="Programa não encontrado"
                        description="Programa de exercícios não encontrado."
                        action={
                            <DsButton
                                variant="primary"
                                label="Voltar aos programas"
                                onClick={() => navigate(listPath)}
                            />
                        }
                    />
                </div>
            </div>
        );
    }

    const totalExercises = allExercises.length;
    const slug = clinicSlug || program.clinicSlug || '';
    const canNavigate = Boolean(slug);
    const crefito = formatCrefito(program.professionalRegistration);

    const progressPct =
        totalExercises > 0
            ? Math.round((completedCount / totalExercises) * 100)
            : 0;

    const toggleSeries = (exercise: PatientExercise, serieNumber: number) => {
        setDoneSeriesByExercise((prev) => {
            const current = prev[exercise.id] ?? 0;
            const next =
                current === serieNumber ? serieNumber - 1 : serieNumber;
            return { ...prev, [exercise.id]: next };
        });
    };

    const toggleFullExercise = (exercise: PatientExercise) => {
        const target = targetSeriesCount(exercise);
        setDoneSeriesByExercise((prev) => {
            const current = prev[exercise.id] ?? 0;
            return {
                ...prev,
                [exercise.id]: current >= target ? 0 : target,
            };
        });
    };

    const radius = 34;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (progressPct / 100) * circumference;

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
            <DsPatientNavbar clinicName={program.clinicName} />

            <main className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-4 py-6 pb-24 sm:px-6 sm:py-8">
                {/* Topo com voltar e fisioterapeuta */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    {canNavigate ? (
                        <DsButton
                            variant="tertiary"
                            size="sm"
                            iconPosition="left"
                            icon={<ArrowLeft className="size-3.5" />}
                            label="Meus programas"
                            onClick={() => navigate(listPath)}
                        />
                    ) : (
                        <span />
                    )}

                    <div className="flex items-center gap-2 rounded-ds-pill border border-ds-border-subtle bg-ds-surface-default px-3 py-1 text-ds-caption shadow-ds-xs">
                        <UserCheck className="size-3.5 text-ds-content-brand" />
                        <span className="font-semibold text-ds-content-primary">
                            {program.professionalName}
                        </span>
                        {crefito && (
                            <span className="text-ds-content-muted">
                                · {crefito}
                            </span>
                        )}
                    </div>
                </div>

                {/* Painel vivo de progresso circular */}
                <section className="rounded-ds-2xl border border-ds-border-subtle bg-ds-surface-default p-5 shadow-ds-sm sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative flex size-22 shrink-0 items-center justify-center">
                                <svg
                                    className="size-22 -rotate-90"
                                    viewBox="0 0 84 84"
                                >
                                    <circle
                                        cx="42"
                                        cy="42"
                                        r={radius}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="7"
                                        className="text-ds-surface-subtle"
                                    />
                                    <circle
                                        cx="42"
                                        cy="42"
                                        r={radius}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="7"
                                        strokeLinecap="round"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashOffset}
                                        className="text-ds-primary-80 transition-all duration-300"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="font-ds-mono text-ds-body-md leading-none font-semibold text-ds-content-primary">
                                        {progressPct}%
                                    </span>
                                    <span className="mt-0.5 font-ds-mono text-[10px] text-ds-content-muted">
                                        {completedCount}/{totalExercises}
                                    </span>
                                </div>
                            </div>

                            <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <DsBadge variant="primary" dot>
                                        Checklist diário interativo
                                    </DsBadge>
                                    <span className="inline-flex items-center gap-1 text-ds-caption text-ds-content-muted">
                                        <Calendar className="size-3.5 text-ds-content-brand" />
                                        {formatDateRange(
                                            program.startDate,
                                            program.endDate,
                                        )}
                                    </span>
                                </div>
                                <h1 className="text-ds-h4 font-semibold tracking-tight text-ds-content-primary sm:text-ds-h3">
                                    {program.name}
                                </h1>
                                <p className="text-ds-caption text-ds-content-muted">
                                    Toque nas séries abaixo conforme realiza
                                    cada exercício ou abra o modo guiado.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                            <DsButton
                                variant="primary"
                                size="md"
                                iconPosition="left"
                                icon={<Play className="size-4 fill-current" />}
                                label="Iniciar exercícios"
                                disabled={!canNavigate}
                                onClick={() =>
                                    slug &&
                                    navigate(
                                        patientProgramExecutePath(
                                            slug,
                                            publicToken,
                                        ),
                                    )
                                }
                            />
                            <div className="flex items-center gap-1.5">
                                {completedCount > 0 && (
                                    <DsButton
                                        variant="tertiary"
                                        size="sm"
                                        iconPosition="left"
                                        icon={
                                            <RotateCcw className="size-3.5" />
                                        }
                                        label="Zerar"
                                        onClick={() =>
                                            setDoneSeriesByExercise({})
                                        }
                                    />
                                )}
                                <DsButton
                                    variant="secondary"
                                    size="sm"
                                    iconPosition="left"
                                    icon={<CheckCircle2 className="size-3.5" />}
                                    label={
                                        completedCount > 0
                                            ? `Confirmar (${completedCount}/${totalExercises})`
                                            : 'Marcar exercícios como feitos'
                                    }
                                    disabled={!canNavigate}
                                    onClick={() =>
                                        slug &&
                                        navigate(
                                            patientProgramFeedbackPath(
                                                slug,
                                                publicToken,
                                            ),
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Lista de exercícios com player quadrado (1:1 tipo Instagram) e pílulas de série */}
                {program.groups.map((group) => (
                    <section key={group.id} className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-ds-body-md font-semibold text-ds-content-primary">
                                {group.name}
                            </h2>
                            <span className="font-ds-mono text-ds-caption text-ds-content-muted">
                                {group.exercises.length} itens
                            </span>
                        </div>

                        <div className="space-y-3">
                            {group.exercises.map((exercise, idx) => {
                                const target = targetSeriesCount(exercise);
                                const done =
                                    doneSeriesByExercise[exercise.id] ?? 0;
                                const isComplete = done >= target;
                                const metrics = extractDoseMetrics(exercise);
                                const notes = cleanNotes(exercise.notes);

                                return (
                                    <article
                                        key={exercise.id}
                                        className={dsCn(
                                            'rounded-ds-2xl border p-4 shadow-ds-xs transition-all sm:p-5',
                                            isComplete
                                                ? 'border-ds-status-success-border bg-ds-status-success-surface/40'
                                                : 'border-ds-border-subtle bg-ds-surface-default',
                                        )}
                                    >
                                        <div className="flex items-center gap-3.5 sm:gap-4">
                                            {/* Botão circular de check rápido */}
                                            <button
                                                type="button"
                                                aria-label={`Marcar ${exercise.name} como concluído`}
                                                onClick={() =>
                                                    toggleFullExercise(exercise)
                                                }
                                                className={dsCn(
                                                    'flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-ds-full border-2 font-ds-mono text-ds-caption font-semibold transition-all sm:size-10',
                                                    isComplete
                                                        ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-white'
                                                        : 'border-ds-border-subtle bg-ds-surface-subtle text-ds-content-muted hover:border-ds-primary-80',
                                                )}
                                            >
                                                {isComplete ? (
                                                    <Check className="size-4 sm:size-5" />
                                                ) : (
                                                    String(idx + 1).padStart(
                                                        2,
                                                        '0',
                                                    )
                                                )}
                                            </button>

                                            {/* Player quadrado 1:1 (estilo post do Instagram) */}
                                            <div className="group relative aspect-square size-24 shrink-0 overflow-hidden rounded-ds-xl bg-ds-surface-subtle sm:size-28">
                                                <VideoThumb
                                                    videoUrl={exercise.videoUrl}
                                                    thumbnailUrl={
                                                        exercise.thumbnailUrl
                                                    }
                                                />
                                            </div>

                                            {/* Texto e pílulas de série */}
                                            <div className="min-w-0 flex-1 space-y-2.5">
                                                <div className="flex flex-wrap items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <h3
                                                            onClick={() =>
                                                                setPreviewExercise(
                                                                    exercise,
                                                                )
                                                            }
                                                            className={dsCn(
                                                                'cursor-pointer text-ds-body-sm font-semibold transition-colors hover:text-ds-content-brand',
                                                                isComplete &&
                                                                    'line-through opacity-75',
                                                            )}
                                                        >
                                                            {exercise.name}
                                                        </h3>
                                                        <p className="mt-0.5 text-ds-caption text-ds-content-muted">
                                                            {metrics
                                                                .map(
                                                                    (m) =>
                                                                        `${m.label}: ${m.value} ${m.unit}`,
                                                                )
                                                                .join(' · ')}
                                                        </p>
                                                    </div>

                                                    <DsButton
                                                        variant="tertiary"
                                                        size="sm"
                                                        iconPosition="left"
                                                        icon={
                                                            <Eye className="size-3.5" />
                                                        }
                                                        label="Espiar vídeo"
                                                        onClick={() =>
                                                            setPreviewExercise(
                                                                exercise,
                                                            )
                                                        }
                                                    />
                                                </div>

                                                {/* Botões de cada série */}
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-ds-mono text-[11px] text-ds-content-muted">
                                                        Séries:
                                                    </span>
                                                    {Array.from(
                                                        { length: target },
                                                        (_, i) => i + 1,
                                                    ).map((serieNum) => {
                                                        const checked =
                                                            done >= serieNum;
                                                        return (
                                                            <button
                                                                key={serieNum}
                                                                type="button"
                                                                onClick={() =>
                                                                    toggleSeries(
                                                                        exercise,
                                                                        serieNum,
                                                                    )
                                                                }
                                                                className={dsCn(
                                                                    'inline-flex cursor-pointer items-center gap-1.5 rounded-ds-pill border px-3 py-1 font-ds-mono text-ds-caption font-medium transition-all',
                                                                    checked
                                                                        ? 'border-ds-primary-80 bg-ds-primary-80 text-ds-white shadow-ds-xs'
                                                                        : 'border-ds-border-subtle bg-ds-surface-subtle text-ds-content-secondary hover:border-ds-border-brand-subtle',
                                                                )}
                                                            >
                                                                {checked && (
                                                                    <Check className="size-3" />
                                                                )}
                                                                {serieNum}ª
                                                                série
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {notes && (
                                            <p className="mt-3 border-t border-ds-border-subtle pt-2.5 text-ds-caption text-ds-content-secondary">
                                                <span className="font-semibold">
                                                    Dica:
                                                </span>{' '}
                                                {notes}
                                            </p>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </main>

            {/* Gaveta lateral (DsDrawer) com player quadrado 1:1 */}
            <DsDrawer
                open={previewExercise !== null}
                onOpenChange={(open) => {
                    if (!open) setPreviewExercise(null);
                }}
                placement="right"
                size="md"
                title={previewExercise?.name ?? 'Exercício'}
                meta="Demonstração e prescrição"
                footer={
                    previewExercise && (
                        <div className="flex w-full justify-between gap-2">
                            <DsButton
                                variant="secondary"
                                label="Página completa"
                                onClick={() =>
                                    slug &&
                                    navigate(
                                        patientExerciseDetailPath(
                                            slug,
                                            publicToken,
                                            previewExercise.id,
                                        ),
                                    )
                                }
                            />
                            <DsButton
                                variant="primary"
                                iconPosition="left"
                                icon={<Play className="size-4 fill-current" />}
                                label="Treinar a partir deste"
                                onClick={() =>
                                    slug &&
                                    navigate(
                                        patientProgramExecutePath(
                                            slug,
                                            publicToken,
                                            previewExercise.id,
                                        ),
                                    )
                                }
                            />
                        </div>
                    )
                }
            >
                {previewExercise && (
                    <div className="space-y-4">
                        <div className="group relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-ds-2xl bg-ds-surface-inverse">
                            <VideoThumb
                                size="lg"
                                videoUrl={previewExercise.videoUrl}
                                thumbnailUrl={previewExercise.thumbnailUrl}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            {extractDoseMetrics(previewExercise).map((m) => (
                                <div
                                    key={m.key}
                                    className="rounded-ds-lg border border-ds-border-subtle bg-ds-surface-subtle p-3"
                                >
                                    <p className="font-ds-mono text-[10px] tracking-wider text-ds-content-muted uppercase">
                                        {m.label}
                                    </p>
                                    <p className="mt-0.5 font-ds-mono text-ds-body-md font-semibold text-ds-content-primary">
                                        {m.value}{' '}
                                        <span className="font-ds text-ds-caption font-normal text-ds-content-muted">
                                            {m.unit}
                                        </span>
                                    </p>
                                </div>
                            ))}
                        </div>

                        {cleanNotes(previewExercise.notes) && (
                            <div className="flex items-start gap-2.5 rounded-ds-lg border border-ds-border-brand-subtle bg-ds-surface-brand-subtle p-3.5 text-ds-body-xs">
                                <Sparkles className="mt-0.5 size-4 shrink-0 text-ds-content-brand" />
                                <p className="text-ds-content-secondary">
                                    {cleanNotes(previewExercise.notes)}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </DsDrawer>
        </div>
    );
}
