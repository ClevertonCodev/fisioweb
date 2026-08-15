import {
    Activity,
    ArrowLeft,
    Calendar,
    Check,
    CheckCircle2,
    Clock,
    Loader2,
    Play,
    UserCheck,
} from 'lucide-react';
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
import { PatientNavbar } from '@/components/PatientNavbar';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { VideoThumb } from '@/components/VideoThumb';
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
        <div className="scrollbar-thin flex h-screen flex-col overflow-y-auto bg-background transition-colors duration-200">
            <PatientNavbar />
            <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
                {slug && (
                    <button
                        type="button"
                        onClick={() => navigate(listPath)}
                        className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Meus programas
                    </button>
                )}

                {/* Program Header Info */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="rounded-md border border-primary/10 bg-accent/60 px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
                                Programa
                            </span>
                        </div>

                        <h1 className="font-serif text-2xl leading-tight font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
                            {program.name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-muted-foreground sm:text-sm">
                            <div className="flex items-center gap-1.5 font-medium">
                                <Activity className="h-4 w-4 text-primary" />
                                <span>{totalExercises} exercícios</span>
                            </div>

                            <span className="hidden text-border sm:inline">
                                •
                            </span>

                            <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="h-4 w-4 text-primary" />
                                <span>2 – 12 minutos</span>
                            </div>

                            <span className="hidden text-border sm:inline">
                                •
                            </span>

                            <div className="flex items-center gap-1.5 font-medium">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span>
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
                    </div>

                    {/* Physiotherapist Card */}
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-xs transition-all hover:shadow-sm sm:p-4.5">
                        <div className="flex items-center gap-3.5">
                            {program.professionalPhotoUrl ? (
                                <img
                                    src={program.professionalPhotoUrl}
                                    alt={program.professionalName}
                                    className="h-12 w-12 rounded-full border-2 border-background object-cover shadow-xs ring-2 ring-primary/20"
                                />
                            ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-background bg-primary text-lg font-medium text-primary-foreground shadow-xs ring-2 ring-primary/20">
                                    {program.professionalName.charAt(0)}
                                </div>
                            )}

                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="text-sm leading-snug font-semibold text-foreground sm:text-base">
                                        {program.professionalName}
                                    </h3>
                                    <UserCheck className="h-3.5 w-3.5 text-primary" />
                                </div>
                                <p className="text-xs font-medium text-muted-foreground">
                                    Fisioterapeuta
                                    {program.professionalRegistration &&
                                        /[A-Za-zÀ-ÿ]/u.test(
                                            program.professionalRegistration,
                                        ) &&
                                        ` · CREFITO ${program.professionalRegistration}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Overall Progress Bar */}
                    <div className="space-y-2 rounded-xl border border-border/60 bg-secondary/50 p-3.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-muted-foreground">
                                Progresso do programa
                            </span>
                            <span className="font-bold text-foreground">
                                0 de {totalExercises} concluídos (0%)
                            </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: '0%' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={() =>
                            slug &&
                            navigate(
                                patientProgramExecutePath(slug, publicToken),
                            )
                        }
                        disabled={!slug}
                        className="group relative flex w-full cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-primary/20 bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:bg-primary/95 hover:shadow-lg active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
                    >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 transition-transform group-hover:scale-110">
                            <Play className="ml-0.5 h-3.5 w-3.5 fill-current text-primary-foreground" />
                        </div>
                        <span>Iniciar exercícios</span>
                    </button>

                    <button
                        onClick={() =>
                            slug &&
                            navigate(
                                patientProgramFeedbackPath(slug, publicToken),
                            )
                        }
                        disabled={!slug}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-xs font-medium text-foreground shadow-2xs transition-all hover:bg-secondary hover:shadow-xs active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                    >
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span>Marcar exercícios como feitos</span>
                    </button>
                </div>

                {/* 2 Groups Accordion with Inline Exercise Cards */}
                <div className="pt-2">
                    <Accordion
                        type="multiple"
                        defaultValue={program.groups.map((g) => g.id)}
                        className="space-y-4"
                    >
                        {program.groups.map((group) => (
                            <AccordionItem
                                key={group.id}
                                value={group.id}
                                className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xs transition-all duration-200"
                            >
                                <AccordionTrigger className="group p-4 transition-colors hover:bg-secondary/40 hover:no-underline sm:p-5">
                                    <div className="flex w-full items-center justify-between pr-4">
                                        <span className="font-serif text-lg leading-none font-bold text-foreground sm:text-xl">
                                            {group.name}
                                        </span>
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/10 bg-accent/80 font-sans text-xs font-bold text-accent-foreground">
                                            {group.exercises.length}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="border-t border-border/50 bg-background/50 px-3 pt-1 pb-3 sm:px-4 sm:pb-4">
                                    <div className="mt-3 flex flex-col gap-3">
                                        {group.exercises.map((exercise) => (
                                            <div
                                                key={exercise.id}
                                                className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs transition-all duration-300 hover:bg-secondary/30"
                                            >
                                                <div className="flex items-center gap-3.5 p-3 sm:gap-4 sm:p-3.5">
                                                    {/* Padrão do sistema (ProgramasTab/StepConfigureExercises):
                                                        quadrado + VideoThumb com play inline. */}
                                                    <div className="group relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted sm:h-24 sm:w-24">
                                                        <VideoThumb
                                                            videoUrl={
                                                                exercise.videoUrl
                                                            }
                                                            thumbnailUrl={
                                                                exercise.thumbnailUrl
                                                            }
                                                        />
                                                    </div>

                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <h4
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
                                                            className="cursor-pointer text-sm leading-tight font-semibold text-foreground transition-colors hover:text-primary sm:text-base"
                                                        >
                                                            {exercise.name}
                                                        </h4>
                                                        <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">
                                                            {formatPrescription(
                                                                exercise,
                                                            )}
                                                        </p>
                                                        {exercise.notes && (
                                                            <p className="mt-1 line-clamp-1 text-xs text-foreground/80">
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

                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <button
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
                                                            title="Ver exercício"
                                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:border-primary/30 hover:bg-accent sm:h-9 sm:w-9"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </main>
        </div>
    );
}
