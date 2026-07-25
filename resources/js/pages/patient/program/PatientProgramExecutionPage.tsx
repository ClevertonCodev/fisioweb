import { Loader2, ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { patientProgramFeedbackPath } from '@/application/patient/patient-program-paths';
import {
    usePatientProgram,
    useSaveProgramSeries,
    useStartOrResumeExecution,
} from '@/application/patient/use-patient-program';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PatientProgramExecutionPage() {
    const { clinicSlug = '', publicToken = '' } = useParams<{
        clinicSlug: string;
        publicToken: string;
    }>();
    const [searchParams] = useSearchParams();
    const startAt = searchParams.get('startAt');
    const navigate = useNavigate();

    const { data: program, isLoading } = usePatientProgram(publicToken || '');
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

    if (isLoading || exercises.length === 0) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-white p-4 text-center text-muted-foreground overflow-y-auto">
                <Loader2 className="mb-4 h-8 w-8 animate-spin" />
                <p>Iniciando execução do programa. Aguarde...</p>
            </div>
        );
    }

    const exercise = exercises[currentIndex];
    const totalSeries =
        exercise.prescription.seriesMax ||
        exercise.prescription.seriesMin ||
        1;
    const groupName =
        program?.groups.find((g) =>
            g.exercises.some((e) => e.id === exercise.id),
        )?.name || '';

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
                            exercise.prescription.repetitionsMin ??
                            exercise.prescription.repetitionsMax,
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
            const slug = clinicSlug || program?.clinicSlug || '';
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

    return (
        <div className="h-screen bg-white overflow-y-auto">
            <header className="flex h-16 items-center border-b border-slate-100 bg-white px-4 md:px-8">
                <Button
                    variant="ghost"
                    className="text-slate-600 hover:bg-slate-50"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
            </header>

            <main className="mx-auto max-w-6xl p-6 md:p-8">
                <div className="mb-8">
                    <h1 className="text-xl font-semibold text-slate-900">
                        {program?.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">{groupName}</p>
                    <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
                        <span>{exercises.length} exercícios</span>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-2">
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-100 lg:aspect-auto lg:h-[600px]">
                        <div className="absolute bottom-0 left-0 top-0 w-1/3 bg-[#217b7e]"></div>
                        {exercise.videoUrl ? (
                            <iframe
                                src={exercise.videoUrl}
                                className="absolute inset-0 z-10 h-full w-full border-0"
                                allow="fullscreen; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        ) : (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-200 text-slate-500">
                                <p>Vídeo indisponível</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <h2 className="text-2xl font-semibold text-slate-900">
                            {exercise.name}
                        </h2>

                        <div className="mt-6">
                            <p className="text-sm font-medium text-slate-600">
                                {exercise.prescription.seriesMin} a{' '}
                                {exercise.prescription.seriesMax ||
                                    exercise.prescription.seriesMin}{' '}
                                séries
                            </p>
                            <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-5xl font-bold text-slate-900">
                                    {exercise.prescription.repetitionsMin}
                                </span>
                                {exercise.prescription.repetitionsMax && (
                                    <>
                                        <span className="text-3xl font-medium text-slate-400">
                                            a
                                        </span>
                                        <span className="text-5xl font-bold text-slate-900">
                                            {
                                                exercise.prescription
                                                    .repetitionsMax
                                            }
                                        </span>
                                    </>
                                )}
                                <span className="ml-2 text-2xl font-medium text-slate-700">
                                    repetições
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2">
                            {exercise.days && exercise.days.length > 0 && (
                                <Badge className="rounded-md border-0 bg-[#e0f0f1] px-3 py-1 text-sm font-medium text-[#217b7e] hover:bg-[#d0e8e9]">
                                    {exercise.days.join(', ')}
                                </Badge>
                            )}
                            {exercise.period && exercise.period.length > 0 && (
                                <Badge className="rounded-md border-0 bg-[#e0f0f1] px-3 py-1 text-sm font-medium text-[#217b7e] hover:bg-[#d0e8e9]">
                                    {exercise.period.join(', ')}
                                </Badge>
                            )}
                        </div>

                        {exercise.prescription.loadMin !== undefined && (
                            <div className="mt-8 max-w-xs space-y-3">
                                <Label
                                    htmlFor="load"
                                    className="text-sm font-medium text-slate-700"
                                >
                                    Última carga utilizada (em kg)
                                </Label>
                                <Input
                                    id="load"
                                    type="number"
                                    value={load}
                                    onChange={(e) => setLoad(e.target.value)}
                                    className="h-12 border-slate-300"
                                    placeholder={String(
                                        exercise.prescription.loadMin,
                                    )}
                                />
                            </div>
                        )}

                        {exercise.description && (
                            <div className="mt-8 space-y-2">
                                <h4 className="font-semibold text-slate-900">
                                    Descrição
                                </h4>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                                    {exercise.description}
                                </p>
                            </div>
                        )}

                        {exercise.notes && (
                            <div className="mt-8 space-y-2">
                                <h4 className="font-semibold text-slate-900">
                                    Orientações do fisioterapeuta
                                </h4>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                                    {exercise.notes}
                                </p>
                            </div>
                        )}

                        <div className="min-h-[40px] flex-1"></div>

                        <div className="mt-8">
                            <div className="mb-6 flex gap-1.5">
                                {Array.from({ length: totalSeries }).map(
                                    (_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 flex-1 rounded-full transition-colors ${i < currentSeries ? 'bg-[#217b7e]' : 'bg-slate-200'}`}
                                        />
                                    ),
                                )}
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    className="h-12 flex-1 border-slate-300 text-base font-medium text-slate-700 hover:bg-slate-50"
                                    onClick={handlePrevious}
                                >
                                    Anterior
                                </Button>
                                <Button
                                    className="h-12 flex-1 bg-[#217b7e] text-base font-medium hover:bg-[#1a6265]"
                                    onClick={() => void handleNextSeries()}
                                >
                                    {currentSeries < totalSeries
                                        ? 'Próxima série'
                                        : currentIndex < exercises.length - 1
                                          ? 'Próximo exercício'
                                          : 'Finalizar programa'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
