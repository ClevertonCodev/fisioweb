import { AlertCircle, Loader2, Play, Sparkles, VideoOff } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import { patientProgramExecutePath } from '@/application/patient/patient-program-paths';
import { usePatientProgram } from '@/application/patient/use-patient-program';
import {
    DsBadge,
    DsButton,
    DsEmptyState,
    DsPatientNavbar,
} from '@/components/ds';
import type { PatientExercise } from '@/domain/patient/program';

interface DoseMetric {
    key: string;
    label: string;
    value: string;
    unit: string;
}

function findExercise(
    groups: { exercises: PatientExercise[] }[],
    exerciseId: string,
): PatientExercise | undefined {
    for (const group of groups) {
        const found = group.exercises.find((e) => e.id === exerciseId);
        if (found) return found;
    }
    return undefined;
}

function cleanNotes(notes?: string): string | null {
    if (!notes) return null;
    return notes.replace(/^Descrição:\s*/i, '').trim() || null;
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

    if (p.intensity) {
        metrics.push({
            key: 'intensity',
            label: 'Esforço',
            value: p.intensity,
            unit: '',
        });
    }

    return metrics;
}

function SquareExerciseVideo({ exercise }: { exercise: PatientExercise }) {
    return (
        <div className="relative aspect-square w-full overflow-hidden rounded-ds-2xl border border-ds-border-subtle bg-ds-surface-inverse">
            {exercise.videoUrl ? (
                <iframe
                    src={exercise.videoUrl}
                    title={`Vídeo: ${exercise.name}`}
                    className="size-full border-0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                />
            ) : (
                <div className="flex size-full flex-col items-center justify-center gap-2 bg-ds-surface-subtle text-ds-content-muted">
                    <VideoOff className="size-8" />
                    <p className="text-ds-body-sm">Vídeo indisponível</p>
                </div>
            )}
        </div>
    );
}

function FrequencyChips({ exercise }: { exercise: PatientExercise }) {
    if (!exercise.days?.length && !exercise.period?.length) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {exercise.days?.map((day) => (
                <DsBadge key={day} variant="info">
                    {day}
                </DsBadge>
            ))}
            {exercise.period?.map((period) => (
                <DsBadge key={period} variant="primary">
                    {period}
                </DsBadge>
            ))}
        </div>
    );
}

export default function PatientExerciseDetailPage() {
    const {
        clinicSlug = '',
        publicToken = '',
        exerciseId = '',
    } = useParams<{
        clinicSlug: string;
        publicToken: string;
        exerciseId: string;
    }>();
    const navigate = useNavigate();

    const {
        data: program,
        isLoading,
        isError,
    } = usePatientProgram(publicToken);

    const onBack = () => navigate(-1);

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-ds-surface-body p-6 text-center font-ds text-ds-content-secondary">
                <Loader2 className="size-8 animate-spin text-ds-primary-80 ds-dark:text-ds-primary-40" />
                <p className="text-ds-body-sm">Carregando exercício…</p>
            </div>
        );
    }

    if (isError || !program || !exerciseId) {
        return (
            <div className="flex h-full w-full flex-col bg-ds-surface-body font-ds text-ds-content-primary">
                <DsPatientNavbar showPrototypeBadge onBack={onBack} />
                <div className="flex flex-1 items-center justify-center p-6">
                    <DsEmptyState
                        icon={<AlertCircle className="size-6" />}
                        title="Exercício não encontrado"
                        description="Volte ao programa e escolha outro exercício."
                        action={
                            <DsButton
                                variant="secondary"
                                label="Voltar"
                                onClick={onBack}
                            />
                        }
                    />
                </div>
            </div>
        );
    }

    const exercise = findExercise(program.groups, exerciseId);

    if (!exercise) {
        return (
            <div className="flex h-full w-full flex-col bg-ds-surface-body font-ds text-ds-content-primary">
                <DsPatientNavbar showPrototypeBadge onBack={onBack} />
                <div className="flex flex-1 items-center justify-center p-6">
                    <DsEmptyState
                        icon={<AlertCircle className="size-6" />}
                        title="Exercício não encontrado no programa"
                        description="Este exercício pode ter sido removido do programa."
                        action={
                            <DsButton
                                variant="secondary"
                                label="Voltar"
                                onClick={onBack}
                            />
                        }
                    />
                </div>
            </div>
        );
    }

    const metrics = extractDoseMetrics(exercise);
    const notes = cleanNotes(exercise.notes);
    const slug = clinicSlug || program.clinicSlug || '';

    const onStart = () => {
        navigate(patientProgramExecutePath(slug, publicToken, exercise.id));
    };

    return (
        <div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body pb-32 font-ds text-ds-content-primary">
            <DsPatientNavbar
                clinicName={program.clinicName}
                title={exercise.name}
                onBack={onBack}
                showPrototypeBadge
            />

            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 sm:px-6 lg:py-8">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-start">
                    <div className="mx-auto w-full max-w-[360px] lg:sticky lg:top-4 lg:mx-0 lg:max-w-none">
                        <SquareExerciseVideo exercise={exercise} />
                    </div>

                    <div className="min-w-0 space-y-5">
                        {exercise.description && (
                            <p className="text-ds-body-sm text-ds-content-secondary">
                                {exercise.description}
                            </p>
                        )}

                        {metrics.length > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-ds-body-md font-semibold text-ds-content-primary">
                                    Dose prescrita
                                </h2>
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                                    {metrics.map((m) => (
                                        <div
                                            key={m.key}
                                            className="rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs"
                                        >
                                            <p className="font-ds-mono text-[10px] tracking-wider text-ds-content-muted uppercase">
                                                {m.label}
                                            </p>
                                            <p className="mt-0.5 font-ds-mono text-ds-body-md font-semibold text-ds-content-primary">
                                                {m.value}{' '}
                                                {m.unit && (
                                                    <span className="font-ds text-ds-caption font-normal text-ds-content-muted">
                                                        {m.unit}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {((exercise.days?.length ?? 0) > 0 ||
                            (exercise.period?.length ?? 0) > 0) && (
                            <section className="rounded-ds-xl border border-ds-border-default bg-ds-surface-default p-4">
                                <h2 className="mb-2 text-ds-body-sm font-semibold text-ds-content-primary">
                                    Quando fazer
                                </h2>
                                <FrequencyChips exercise={exercise} />
                            </section>
                        )}

                        {notes && (
                            <div className="flex items-start gap-2.5 rounded-ds-xl border border-ds-border-brand-subtle bg-ds-surface-brand-subtle p-4 text-ds-body-sm">
                                <Sparkles className="mt-0.5 size-4 shrink-0 text-ds-content-brand" />
                                <p className="whitespace-pre-wrap text-ds-content-secondary">
                                    {notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <div className="fixed right-0 bottom-0 left-0 z-20 border-t border-ds-border-subtle bg-ds-surface-default/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
                <div className="mx-auto flex w-full max-w-lg gap-2">
                    <DsButton
                        variant="secondary"
                        className="min-w-0 flex-1"
                        label="Sair"
                        onClick={onBack}
                    />
                    <DsButton
                        variant="primary"
                        className="min-w-0 flex-[2]"
                        iconPosition="left"
                        icon={<Play className="size-4 fill-current" />}
                        label="Iniciar exercícios"
                        onClick={onStart}
                    />
                </div>
            </div>
        </div>
    );
}
