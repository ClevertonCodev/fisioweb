import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Clock, Copy, Dumbbell, MoreVertical, Pencil, Play, Repeat, Trash2, User } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import FlashMessage from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ClinicLayout from '@/layouts/clinic-layout';
import type { TreatmentPlan, TreatmentPlanExercise } from '@/types';

const STATUS_COLORS: Record<string, string> = {
    draft: 'text-gray-600 border-gray-200 bg-gray-50',
    active: 'border-transparent bg-blue-500 text-white',
    completed: 'border-transparent bg-primary text-primary-foreground',
    cancelled: 'border-transparent bg-destructive text-destructive-foreground',
};

const PERIOD_LABELS: Record<string, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    night: 'Noite',
};

const DAY_LABELS: Record<string, string> = {
    mon: 'Seg',
    tue: 'Ter',
    wed: 'Qua',
    thu: 'Qui',
    fri: 'Sex',
    sat: 'Sáb',
    sun: 'Dom',
    all: 'Todos',
};

interface ShowProps {
    plan: TreatmentPlan;
    statuses: Record<string, string>;
    periods: Record<string, string>;
}

function formatFrequency(item: TreatmentPlanExercise): string {
    const parts: string[] = [];

    if (item.days_of_week && item.days_of_week.length > 0) {
        const days = item.days_of_week.map((d) => DAY_LABELS[d] || d).join(', ');
        parts.push(days);
    }

    if (item.period) {
        parts.push(PERIOD_LABELS[item.period] || item.period);
    }

    if (item.sets_min || item.sets_max) {
        const sets =
            item.sets_min === item.sets_max ? `${item.sets_min} séries` : `${item.sets_min || '—'}-${item.sets_max || '—'} séries`;
        parts.push(sets);
    }

    if (item.repetitions_min || item.repetitions_max) {
        const reps =
            item.repetitions_min === item.repetitions_max
                ? `${item.repetitions_min} reps`
                : `${item.repetitions_min || '—'}-${item.repetitions_max || '—'} reps`;
        parts.push(reps);
    }

    if (item.rest_time) {
        parts.push(`descanso ${item.rest_time}`);
    }

    return parts.length > 0 ? parts.join(' · ') : 'Sem frequência definida';
}

function ExerciseRow({ item }: { item: TreatmentPlanExercise }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    if (!item.exercise) return null;

    const exercise = item.exercise;
    const video = exercise.videos?.[0];
    const videoUrl = video?.url || video?.cdn_url;
    const thumbnailUrl = video?.thumbnail_url;

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        const el = videoRef.current;
        if (!el) return;
        if (isPlaying) {
            el.pause();
            setIsPlaying(false);
        } else {
            el.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="flex items-center gap-5 rounded-lg border border-border bg-card p-4">
            {/* Thumbnail / Vídeo */}
            <div className="relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                {videoUrl ? (
                    <>
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            poster={thumbnailUrl ?? undefined}
                            className="h-full w-full object-cover"
                            onEnded={() => setIsPlaying(false)}
                            playsInline
                        />
                        <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center">
                            {!isPlaying && (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/40 backdrop-blur-sm">
                                    <Play className="ml-0.5 h-4 w-4 text-background" fill="currentColor" />
                                </div>
                            )}
                        </button>
                    </>
                ) : thumbnailUrl ? (
                    <img src={thumbnailUrl} alt={exercise.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <Dumbbell className="h-8 w-8 text-muted-foreground/40" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-col gap-1">
                <span className="font-medium text-foreground">{exercise.name}</span>
                <span className="text-sm text-muted-foreground">{formatFrequency(item)}</span>
                {item.notes && <span className="text-xs italic text-muted-foreground">{item.notes}</span>}
                {(item.load_min || item.load_max) && (
                    <span className="text-xs text-muted-foreground">
                        Carga:{' '}
                        {item.load_min === item.load_max ? `${item.load_min} kg` : `${item.load_min || '—'}-${item.load_max || '—'} kg`}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function Show({ plan, statuses }: ShowProps) {
    const formatDate = (date: string | null) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const handleDelete = useCallback(() => {
        if (confirm(`Tem certeza que deseja excluir "${plan.title}"?`)) {
            router.delete(`/clinic/treatment-plans/${plan.id}`);
        }
    }, [plan.id, plan.title]);

    const handleDuplicate = useCallback(() => {
        router.post(`/clinic/treatment-plans/${plan.id}/duplicate`);
    }, [plan.id]);

    const groupedExercises = plan.groups?.map((group) => ({
        ...group,
        exercises: plan.exercises?.filter((e) => e.treatment_plan_group_id === group.id) || [],
    }));
    const ungroupedExercises = plan.exercises?.filter((e) => !e.treatment_plan_group_id) || [];
    const totalExercises = plan.exercises?.length || 0;

    return (
        <ClinicLayout>
            <Head title={plan.title} />
            <div className="flex h-full flex-col">
                <FlashMessage />

                {/* Header fixo */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center justify-between px-6 py-3">
                        <Link href="/clinic/treatment-plans">
                            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                                Voltar
                            </Button>
                        </Link>
                    </div>
                </header>

                {/* Conteúdo */}
                <div className="flex-1 space-y-8 overflow-auto p-6">
                    {/* Card de informações do programa */}
                    <Card className="p-6">
                        <div className="mb-1 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-semibold text-foreground">{plan.title}</h1>
                                <Badge variant="outline" className={STATUS_COLORS[plan.status] || ''}>
                                    {statuses[plan.status] || plan.status}
                                </Badge>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">Ações</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem className="cursor-pointer" onClick={handleDuplicate}>
                                        <Copy className="mr-2 h-4 w-4" />
                                        Duplicar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="cursor-pointer">
                                        <Link href={`/clinic/treatment-plans/${plan.id}/edit`}>
                                            <Pencil className="mr-2 h-4 w-4" />
                                            Editar
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                        onClick={handleDelete}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <p className="mb-1 text-sm text-muted-foreground">Criado por: {plan.clinic_user?.name}</p>
                        <p className="mb-5 text-sm text-muted-foreground">
                            Data de criação: {new Date(plan.created_at).toLocaleDateString('pt-BR')}
                        </p>

                        {/* Linha de infos */}
                        <div className="flex flex-wrap items-center gap-8">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Paciente:</p>
                                    <p className="text-sm font-medium text-foreground">
                                        {plan.patient?.name ?? <span className="italic text-muted-foreground">Template</span>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Exercícios:</p>
                                    <p className="text-sm font-medium text-foreground">{totalExercises} exercícios</p>
                                </div>
                            </div>

                            {plan.duration_minutes && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Duração estimada:</p>
                                        <p className="text-sm font-medium text-foreground">{plan.duration_minutes} min</p>
                                    </div>
                                </div>
                            )}

                            {plan.end_date && (
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Válido até:</p>
                                        <p className="text-sm font-medium text-foreground">{formatDate(plan.end_date)}</p>
                                    </div>
                                </div>
                            )}

                            {plan.start_date && !plan.end_date && (
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Início:</p>
                                        <p className="text-sm font-medium text-foreground">{formatDate(plan.start_date)}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {(plan.physio_area || plan.physio_subarea) && (
                            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                                {plan.physio_area && (
                                    <Badge variant="secondary">
                                        <Repeat className="mr-1 size-3" />
                                        {plan.physio_area.name}
                                    </Badge>
                                )}
                                {plan.physio_subarea && <Badge variant="secondary">{plan.physio_subarea.name}</Badge>}
                            </div>
                        )}
                    </Card>

                    {/* Exercícios sem grupo */}
                    {ungroupedExercises.length > 0 && (
                        <div>
                            {groupedExercises && groupedExercises.some((g) => g.exercises.length > 0) && (
                                <div className="mb-4 flex items-center gap-2">
                                    <h2 className="text-base font-semibold text-foreground">Sem Grupo</h2>
                                    <Badge variant="secondary" className="text-xs">
                                        {ungroupedExercises.length}
                                    </Badge>
                                </div>
                            )}
                            <div className="space-y-3">
                                {ungroupedExercises.map((tpe) => (
                                    <ExerciseRow key={tpe.id} item={tpe} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Exercícios agrupados */}
                    {groupedExercises?.map(
                        (group) =>
                            group.exercises.length > 0 && (
                                <div key={group.id}>
                                    <div className="mb-4 flex items-center gap-2">
                                        <h2 className="text-base font-semibold text-foreground">{group.name}</h2>
                                        <Badge variant="secondary" className="text-xs">
                                            {group.exercises.length}
                                        </Badge>
                                    </div>
                                    <div className="space-y-3">
                                        {group.exercises.map((tpe) => (
                                            <ExerciseRow key={tpe.id} item={tpe} />
                                        ))}
                                    </div>
                                </div>
                            ),
                    )}

                    {totalExercises === 0 && (
                        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum exercício adicionado a este programa.</p>
                    )}

                    {/* Mensagem para o paciente */}
                    {plan.message && (
                        <Card className="p-6">
                            <h2 className="mb-3 text-base font-semibold">Mensagem para o Paciente</h2>
                            <p className="whitespace-pre-line text-sm text-muted-foreground">{plan.message}</p>
                        </Card>
                    )}

                    {/* Observações internas */}
                    {plan.notes && (
                        <Card className="p-6">
                            <h2 className="mb-3 text-base font-semibold">Observações Internas</h2>
                            <p className="whitespace-pre-line text-sm text-muted-foreground">{plan.notes}</p>
                        </Card>
                    )}
                </div>
            </div>
        </ClinicLayout>
    );
}
