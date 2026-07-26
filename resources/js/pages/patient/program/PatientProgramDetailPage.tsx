import { Activity, Calendar, Clock, Loader2, Play } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { PatientExercise } from '@/domain/patient/program';

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

    useEffect(() => {
        if (publicToken && program) {
            registerView(publicToken);
        }
    }, [publicToken, program, registerView]);

    // Alinha URL se o slug da API for o correto (token define a clínica)
    useEffect(() => {
        if (!program?.clinicSlug || !publicToken) return;
        if (paramSlug && paramSlug !== program.clinicSlug) {
            navigate(
                `/${program.clinicSlug}/paciente/programas/${publicToken}`,
                { replace: true },
            );
        }
    }, [program?.clinicSlug, paramSlug, publicToken, navigate]);

    const listPath = clinicSlug ? patientProgramsListPath(clinicSlug) : '/';

    if (!publicToken) {
        return (
            <div className="flex h-screen flex-col items-center justify-center overflow-y-auto p-4 text-center">
                <p>ID do programa não fornecido.</p>
                <Button className="mt-4" onClick={() => navigate(listPath)}>
                    Voltar
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-4 text-center text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Carregando programa…</p>
            </div>
        );
    }

    if (isError || !program) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <Activity className="h-7 w-7" />
                </div>
                <p className="text-sm text-muted-foreground">
                    Programa de exercícios não encontrado.
                </p>
                <Button onClick={() => navigate(listPath)}>
                    Voltar aos programas
                </Button>
            </div>
        );
    }

    const totalExercises = program.groups.reduce(
        (acc, g) => acc + g.exercises.length,
        0,
    );
    const slug = clinicSlug || program.clinicSlug || '';

    const formatPrescription = (exercise: PatientExercise) => {
        const p = exercise.prescription;
        const parts = [];

        if (exercise.days && exercise.days.length > 0)
            parts.push(exercise.days.join(', '));

        if (p.seriesMin && p.seriesMax)
            parts.push(`De ${p.seriesMin} a ${p.seriesMax} séries`);
        else if (p.seriesMin)
            parts.push(
                `${p.seriesMin} ${p.seriesMin === 1 ? 'série' : 'séries'}`,
            );

        if (p.repetitionsMin && p.repetitionsMax)
            parts.push(
                `De ${p.repetitionsMin} a ${p.repetitionsMax} repetições`,
            );
        else if (p.repetitionsMin)
            parts.push(
                `${p.repetitionsMin} ${p.repetitionsMin === 1 ? 'repetição' : 'repetições'}`,
            );

        if (p.loadMin && p.loadMax)
            parts.push(`Carga de ${p.loadMin}kg a ${p.loadMax}kg`);
        else if (p.loadMin) parts.push(`Carga de ${p.loadMin}kg`);

        if (p.restTime) parts.push(`Descanso de ${p.restTime} seg`);
        if (p.maintainFor) parts.push(`Manter por ${p.maintainFor} seg`);
        if (p.intensity) parts.push(`Esforço ${p.intensity}`);

        if (exercise.period && exercise.period.length > 0)
            parts.push(
                `Período d${exercise.period[0].toLowerCase() === 'manhã' ? 'a' : 'o'} ${exercise.period.join(', ')}`,
            );

        return parts.join(', ');
    };

    return (
        <div className="scrollbar-thin h-screen overflow-y-auto bg-background">
            <main className="mx-auto max-w-3xl px-4 py-8 md:px-8 md:py-10">
                <header className="mb-8">
                    <p className="text-[11px] font-semibold tracking-wider text-primary uppercase">
                        Programa
                    </p>
                    <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold text-foreground md:text-4xl">
                        {program.name}
                    </h1>

                    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            <span>
                                <span className="font-mono font-medium text-foreground">
                                    {totalExercises}
                                </span>{' '}
                                exercícios
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>2 – 12 minutos</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="tabular-nums">
                                {program.startDate
                                    ? new Date(
                                          program.startDate,
                                      ).toLocaleDateString('pt-BR')
                                    : '—'}{' '}
                                –{' '}
                                {program.endDate
                                    ? new Date(
                                          program.endDate,
                                      ).toLocaleDateString('pt-BR')
                                    : '—'}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
                    {program.professionalPhotoUrl ? (
                        <img
                            src={program.professionalPhotoUrl}
                            alt={program.professionalName}
                            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-primary/20"
                        />
                    ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground">
                            {program.professionalName.charAt(0)}
                        </div>
                    )}
                    <div>
                        <p className="font-medium text-foreground">
                            {program.professionalName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Fisioterapeuta
                            {program.professionalRegistration &&
                                /[A-Za-zÀ-ÿ]/u.test(
                                    program.professionalRegistration,
                                ) &&
                                ` · CREFITO ${program.professionalRegistration}`}
                        </p>
                    </div>
                </div>

                <div className="mb-10 flex flex-col gap-3">
                    <Button
                        className="h-12 w-full text-base font-semibold"
                        onClick={() =>
                            slug &&
                            navigate(
                                patientProgramExecutePath(slug, publicToken),
                            )
                        }
                        disabled={program.status === 'completed' || !slug}
                    >
                        <Play className="mr-2 h-5 w-5 fill-current" />
                        Iniciar exercícios
                    </Button>
                    <Button
                        variant="outline"
                        className="h-12 w-full text-base font-medium"
                        onClick={() =>
                            slug &&
                            navigate(
                                patientProgramFeedbackPath(slug, publicToken),
                            )
                        }
                        disabled={program.status === 'completed' || !slug}
                    >
                        Marcar exercícios como feitos
                    </Button>
                </div>

                <Accordion
                    type="multiple"
                    defaultValue={program.groups.map((g) => g.id)}
                    className="w-full space-y-4"
                >
                    {program.groups.map((group) => (
                        <AccordionItem
                            key={group.id}
                            value={group.id}
                            className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs"
                        >
                            <AccordionTrigger className="px-5 py-4 hover:no-underline">
                                <div className="flex w-full items-center justify-between pr-4">
                                    <span className="font-serif text-lg font-semibold text-foreground">
                                        {group.name}
                                    </span>
                                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-2 font-mono text-xs font-medium text-accent-foreground">
                                        {group.exercises.length}
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-3 pt-0 pb-3">
                                <div className="flex flex-col gap-2">
                                    {group.exercises.map((exercise) => (
                                        <button
                                            key={exercise.id}
                                            type="button"
                                            className="flex w-full cursor-pointer flex-col gap-4 rounded-xl p-2 text-left transition-colors hover:bg-accent/50 sm:flex-row"
                                            onClick={() =>
                                                slug &&
                                                navigate(
                                                    patientExerciseDetailPath(
                                                        slug,
                                                        publicToken,
                                                        exercise.id,
                                                    ),
                                                )
                                            }
                                        >
                                            <div className="relative flex h-32 w-full shrink-0 overflow-hidden rounded-md sm:w-40">
                                                <div className="w-1/3 bg-primary"></div>
                                                <div className="w-2/3 bg-muted">
                                                    {exercise.thumbnailUrl && (
                                                        <img
                                                            src={
                                                                exercise.thumbnailUrl
                                                            }
                                                            alt={exercise.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Play className="h-10 w-10 fill-white text-white opacity-90 drop-shadow-md" />
                                                </div>
                                            </div>

                                            <div className="flex flex-1 flex-col justify-center">
                                                <h3 className="font-semibold text-foreground">
                                                    {exercise.name}
                                                </h3>
                                                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                                    {formatPrescription(
                                                        exercise,
                                                    )}
                                                </p>
                                                {exercise.notes && (
                                                    <p className="mt-2 text-sm text-foreground/80">
                                                        <span className="font-semibold">
                                                            Orientações:
                                                        </span>{' '}
                                                        {exercise.notes.replace(
                                                            'Descrição: ',
                                                            '',
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </main>
        </div>
    );
}
