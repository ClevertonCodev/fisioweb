import {
    Activity,
    Calendar,
    Clock,
    Loader2,
    Play,
    Check,
    CheckCircle2,
    ShieldCheck,
    UserCheck,
    ChevronDown,
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
        <div className="scrollbar-thin h-screen overflow-y-auto bg-background transition-colors duration-200 flex flex-col">
            <PatientNavbar />
            <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8 space-y-6 flex-1 w-full">
                
                {/* Program Header Info */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold tracking-widest text-primary uppercase font-mono bg-accent/60 px-2.5 py-0.5 rounded-md border border-primary/10">
                                Programa
                            </span>
                        </div>

                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-foreground tracking-tight leading-tight">
                            {program.name}
                        </h1>

                        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-muted-foreground pt-1">
                            <div className="flex items-center gap-1.5 font-medium">
                                <Activity className="w-4 h-4 text-primary" />
                                <span>{totalExercises} exercícios</span>
                            </div>

                            <span className="text-border hidden sm:inline">•</span>

                            <div className="flex items-center gap-1.5 font-medium">
                                <Clock className="w-4 h-4 text-primary" />
                                <span>2 – 12 minutos</span>
                            </div>

                            <span className="text-border hidden sm:inline">•</span>

                            <div className="flex items-center gap-1.5 font-medium">
                                <Calendar className="w-4 h-4 text-primary" />
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
                    <div className="p-4 sm:p-4.5 rounded-xl bg-card border border-border shadow-xs hover:shadow-sm transition-all flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="relative">
                                {program.professionalPhotoUrl ? (
                                    <img
                                        src={program.professionalPhotoUrl}
                                        alt={program.professionalName}
                                        className="w-12 h-12 rounded-full object-cover border-2 border-background ring-2 ring-primary/20 shadow-xs"
                                    />
                                ) : (
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-medium text-primary-foreground border-2 border-background ring-2 ring-primary/20 shadow-xs">
                                        {program.professionalName.charAt(0)}
                                    </div>
                                )}
                                <div
                                    className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground p-0.5 rounded-full border border-card"
                                    title="Profissional Verificado"
                                >
                                    <ShieldCheck className="w-3 h-3" />
                                </div>
                            </div>

                            <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-semibold text-foreground text-sm sm:text-base leading-snug">
                                        {program.professionalName}
                                    </h3>
                                    <UserCheck className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">
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
                    <div className="space-y-2 bg-secondary/50 p-3.5 rounded-xl border border-border/60">
                        <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Progresso do programa</span>
                            <span className="text-foreground font-bold">
                                0 de {totalExercises} concluídos (0%)
                            </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-500 rounded-full"
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
                        className="w-full relative group overflow-hidden py-3.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md hover:shadow-lg hover:bg-primary/95 transition-all duration-200 cursor-pointer border border-primary/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                            <Play className="w-3.5 h-3.5 fill-current text-primary-foreground ml-0.5" />
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
                        className="w-full py-3 px-6 rounded-xl bg-card hover:bg-secondary text-foreground font-medium text-xs sm:text-sm flex items-center justify-center gap-2 border border-border shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckCircle2 className="w-4 h-4 text-primary" />
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
                                className="rounded-2xl bg-card border border-border shadow-2xs overflow-hidden transition-all duration-200"
                            >
                                <AccordionTrigger className="p-4 sm:p-5 hover:bg-secondary/40 transition-colors group hover:no-underline">
                                    <div className="flex w-full items-center justify-between pr-4">
                                        <span className="font-serif font-bold text-lg sm:text-xl text-foreground leading-none">
                                            {group.name}
                                        </span>
                                        <div className="w-6 h-6 rounded-full bg-accent/80 text-accent-foreground text-xs font-sans font-bold flex items-center justify-center border border-primary/10">
                                            {group.exercises.length}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-3 sm:px-4 pt-1 pb-3 sm:pb-4 border-t border-border/50 bg-background/50">
                                    <div className="flex flex-col gap-3 mt-3">
                                        {group.exercises.map((exercise) => (
                                            <div
                                                key={exercise.id}
                                                className="rounded-xl border bg-card hover:bg-secondary/30 border-border shadow-2xs transition-all duration-300 overflow-hidden"
                                            >
                                                <div className="p-3 sm:p-3.5 flex items-center gap-3.5 sm:gap-4">
                                                    <div
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
                                                        className="relative w-28 sm:w-32 h-20 sm:h-22 rounded-lg overflow-hidden shrink-0 bg-muted cursor-pointer group/thumb"
                                                    >
                                                        {exercise.thumbnailUrl && (
                                                            <img
                                                                src={
                                                                    exercise.thumbnailUrl
                                                                }
                                                                alt={exercise.name}
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
                                                            />
                                                        )}
                                                        <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-primary" />
                                                        <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/30 flex items-center justify-center transition-colors">
                                                            <div className="w-8 h-8 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-xs group-hover/thumb:scale-110 transition-transform">
                                                                <Play className="w-4 h-4 fill-current ml-0.5" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0 space-y-1">
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
                                                            className="font-semibold text-sm sm:text-base leading-tight cursor-pointer hover:text-primary transition-colors text-foreground"
                                                        >
                                                            {exercise.name}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
                                                            {formatPrescription(
                                                                exercise,
                                                            )}
                                                        </p>
                                                        {exercise.notes && (
                                                            <p className="text-xs text-foreground/80 mt-1 line-clamp-1">
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

                                                    <div className="shrink-0 flex items-center gap-2">
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
                                                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border bg-card hover:bg-accent hover:border-primary/30 text-muted-foreground border-border"
                                                        >
                                                            <Check className="w-4 h-4" />
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

