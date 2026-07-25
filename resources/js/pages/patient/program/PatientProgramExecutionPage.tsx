import {
    Activity,
    AlertCircle,
    ArrowLeft,
    Clock,
    Flame,
    Layers,
    Loader2,
    Repeat,
    Timer,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
    patientProgramFeedbackPath,
    patientProgramsListPath,
} from '@/application/patient/patient-program-paths';
import {
    usePatientProgram,
    useSaveProgramSeries,
    useStartOrResumeExecution,
} from '@/application/patient/use-patient-program';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { MetricTile } from './components/MetricTile';
import { SeriesTracker } from './components/SeriesTracker';
import { SessionTrack } from './components/SessionTrack';

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

    const [executionId, setExecutionId] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSeries, setCurrentSeries] = useState(1);
    const [load, setLoad] = useState('');
    const [indexInitialized, setIndexInitialized] = useState(false);

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
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Preparando sua sessão…</p>
            </div>
        );
    }

    if (isError || !program) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertCircle className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold text-foreground">
                        Não foi possível carregar a sessão
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Verifique sua conexão e tente novamente.
                    </p>
                </div>
                <Button onClick={() => navigate(0)}>Tentar de novo</Button>
            </div>
        );
    }

    if (exercises.length === 0) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Activity className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                    <h1 className="text-lg font-semibold text-foreground">
                        Nenhum exercício nesta sessão
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Este programa ainda não tem exercícios para executar.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() =>
                        navigate(
                            patientProgramsListPath(
                                clinicSlug || program.clinicSlug || '',
                            ),
                        )
                    }
                >
                    Voltar aos programas
                </Button>
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

    const metrics: Array<{
        icon: typeof Layers;
        label: string;
        value: string;
        unit?: string;
    }> = [
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
    ].filter(Boolean);

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
            // Continua o wizard
        }
    };

    const handleNextSeries = async () => {
        await persistCurrentSeries();
        if (currentSeries < totalSeries) {
            setCurrentSeries((prev) => prev + 1);
            setLoad('');
        } else if (currentIndex < exercises.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setCurrentSeries(1);
            setLoad('');
        } else {
            const slug = clinicSlug || program.clinicSlug || '';
            if (slug) {
                navigate(patientProgramFeedbackPath(slug, publicToken));
            }
        }
    };

    const handlePrevious = () => {
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

    const primaryLabel = !isLastSeries
        ? 'Concluir série'
        : !isLastExercise
          ? 'Próximo exercício'
          : 'Finalizar programa';

    return (
        <div className="flex h-screen flex-col bg-background">
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:px-8">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-1.5 h-4 w-4" /> Sair
                </Button>
                <p className="truncate font-serif text-sm text-muted-foreground">
                    {program.name}
                </p>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {currentIndex + 1}/{exercises.length}
                </span>
            </header>

            <div className="scrollbar-thin flex-1 overflow-y-auto">
                <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-6 md:px-8 lg:grid-cols-[220px_1fr] lg:gap-12 lg:py-10">
                    {/* Trilha da sessão — signature (desktop) */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-10">
                            <p className="mb-4 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Trilha da sessão
                            </p>
                            <SessionTrack
                                items={exercises}
                                currentIndex={currentIndex}
                            />
                        </div>
                    </aside>

                    {/* Palco principal */}
                    <main className="min-w-0">
                        {/* Progresso compacto (mobile) */}
                        <div className="mb-5 flex gap-1 lg:hidden">
                            {exercises.map((e, i) => (
                                <span
                                    key={e.id}
                                    className={cn(
                                        'h-1 flex-1 rounded-full transition-colors',
                                        i < currentIndex && 'bg-primary',
                                        i === currentIndex && 'bg-primary/50',
                                        i > currentIndex && 'bg-border',
                                    )}
                                />
                            ))}
                        </div>

                        <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">
                            {groupName || 'Exercício'}
                        </p>
                        <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold text-foreground md:text-4xl">
                            {exercise.name}
                        </h1>
                        {scheduleParts.length > 0 && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {scheduleParts.join(' · ')}
                            </p>
                        )}

                        {/* Media stage com brilho teal (signature) */}
                        <div className="relative mt-6">
                            <div
                                aria-hidden
                                className="absolute -inset-2 -z-10 rounded-[2rem] bg-primary/10 blur-2xl"
                            />
                            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-foreground shadow-lg lg:aspect-auto lg:h-[600px]">
                                {exercise.videoUrl ? (
                                    <iframe
                                        title={exercise.name}
                                        src={exercise.videoUrl}
                                        className="absolute inset-0 h-full w-full border-0"
                                        allow="fullscreen; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                                        <p className="text-sm">
                                            Vídeo indisponível
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Painel de métricas (números em mono) */}
                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {metrics.map((metric) => (
                                <MetricTile key={metric.label} {...metric} />
                            ))}
                        </div>

                        {/* Série atual */}
                        <div className="mt-6">
                            <SeriesTracker
                                total={totalSeries}
                                current={currentSeries}
                            />
                        </div>

                        {showLoadInput && (
                            <div className="mt-6 max-w-xs space-y-2">
                                <Label
                                    htmlFor="load"
                                    className="text-sm font-medium text-foreground"
                                >
                                    Carga utilizada (kg)
                                </Label>
                                <Input
                                    id="load"
                                    type="number"
                                    inputMode="decimal"
                                    value={load}
                                    onChange={(e) => setLoad(e.target.value)}
                                    className="h-11"
                                    placeholder={String(prescription.loadMin)}
                                />
                            </div>
                        )}

                        {exercise.description && (
                            <section className="mt-8 space-y-2">
                                <h2 className="text-sm font-semibold text-foreground">
                                    Descrição
                                </h2>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                    {exercise.description}
                                </p>
                            </section>
                        )}

                        {exercise.notes && (
                            <section className="mt-6 space-y-2">
                                <h2 className="text-sm font-semibold text-foreground">
                                    Orientações do fisioterapeuta
                                </h2>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                                    {exercise.notes}
                                </p>
                            </section>
                        )}

                        <div className="h-24" />
                    </main>
                </div>
            </div>

            {/* Barra de ação fixa */}
            <div className="shrink-0 border-t border-border bg-card/90 backdrop-blur">
                <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 md:px-8 lg:pl-[calc(220px+3rem+2rem)]">
                    <Button
                        variant="outline"
                        className="h-12 flex-1 text-base font-medium sm:flex-none sm:px-8"
                        onClick={handlePrevious}
                    >
                        Anterior
                    </Button>
                    <Button
                        className="h-12 flex-1 text-base font-semibold"
                        onClick={() => void handleNextSeries()}
                    >
                        {primaryLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
