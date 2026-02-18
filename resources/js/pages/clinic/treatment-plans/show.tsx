import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Copy, Dumbbell, Pencil, Repeat, Trash2, User } from 'lucide-react';
import { useCallback } from 'react';

import FlashMessage from '@/components/flash-message';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ClinicLayout from '@/layouts/clinic-layout';
import type { TreatmentPlan } from '@/types';

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
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

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="text-sm">{value}</dd>
        </div>
    );
}

export default function Show({ plan, statuses }: ShowProps) {
    const formatDate = (date: string | null) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const handleDelete = useCallback(() => {
        if (confirm(`Tem certeza que deseja excluir "${plan.title}"?`)) {
            router.delete(`/clinic/treatment-plans/${plan.id}`);
        }
    }, [plan.id, plan.title]);

    const handleDuplicate = useCallback(() => {
        router.post(`/clinic/treatment-plans/${plan.id}/duplicate`);
    }, [plan.id]);

    // Agrupa exercícios por grupo
    const groupedExercises = plan.groups?.map((group) => ({
        ...group,
        exercises: plan.exercises?.filter((e) => e.treatment_plan_group_id === group.id) || [],
    }));
    const ungroupedExercises = plan.exercises?.filter((e) => !e.treatment_plan_group_id) || [];

    return (
        <ClinicLayout>
            <Head title={plan.title} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto p-6">
                <FlashMessage />

                {/* Cabeçalho */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/clinic/treatment-plans">
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{plan.title}</h1>
                                <Badge className={STATUS_COLORS[plan.status] || ''}>{statuses[plan.status] || plan.status}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Criado por {plan.clinic_user?.name}
                                {plan.physio_area && ` | ${plan.physio_area.name}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleDuplicate}>
                            <Copy className="mr-2 size-4" />
                            Duplicar
                        </Button>
                        <Link href={`/clinic/treatment-plans/${plan.id}/edit`}>
                            <Button variant="outline" size="sm">
                                <Pencil className="mr-2 size-4" />
                                Editar
                            </Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={handleDelete}>
                            <Trash2 className="mr-2 size-4" />
                            Excluir
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Coluna Principal */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* Exercícios */}
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold">
                                <Dumbbell className="mr-2 inline size-5" />
                                Exercícios ({plan.exercises?.length || 0})
                            </h2>

                            {/* Exercícios agrupados */}
                            {groupedExercises?.map(
                                (group) =>
                                    group.exercises.length > 0 && (
                                        <div key={group.id} className="mb-6">
                                            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{group.name}</h3>
                                            <div className="space-y-3">
                                                {group.exercises.map((tpe) => (
                                                    <ExerciseCard key={tpe.id} item={tpe} />
                                                ))}
                                            </div>
                                        </div>
                                    ),
                            )}

                            {/* Exercícios sem grupo */}
                            {ungroupedExercises.length > 0 && (
                                <div className="space-y-3">
                                    {groupedExercises && groupedExercises.some((g) => g.exercises.length > 0) && (
                                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Sem Grupo</h3>
                                    )}
                                    {ungroupedExercises.map((tpe) => (
                                        <ExerciseCard key={tpe.id} item={tpe} />
                                    ))}
                                </div>
                            )}

                            {(!plan.exercises || plan.exercises.length === 0) && (
                                <p className="py-8 text-center text-sm text-muted-foreground">Nenhum exercício adicionado a este programa.</p>
                            )}
                        </div>

                        {/* Mensagem para o paciente */}
                        {plan.message && (
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                <h2 className="mb-4 text-lg font-semibold">Mensagem para o Paciente</h2>
                                <p className="whitespace-pre-line text-sm">{plan.message}</p>
                            </div>
                        )}

                        {/* Observações */}
                        {plan.notes && (
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                <h2 className="mb-4 text-lg font-semibold">Observações Internas</h2>
                                <p className="whitespace-pre-line text-sm">{plan.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Informações */}
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold">Informações</h2>
                            <dl className="space-y-3">
                                {plan.patient && (
                                    <div className="space-y-1">
                                        <dt className="text-sm font-medium text-muted-foreground">
                                            <User className="mr-1 inline size-3" />
                                            Paciente
                                        </dt>
                                        <dd className="text-sm">{plan.patient.name}</dd>
                                    </div>
                                )}
                                {!plan.patient && (
                                    <div className="space-y-1">
                                        <dt className="text-sm font-medium text-muted-foreground">Paciente</dt>
                                        <dd className="text-sm italic text-muted-foreground">Template (sem paciente)</dd>
                                    </div>
                                )}
                                <InfoItem label="Área" value={plan.physio_area?.name} />
                                <InfoItem label="Subárea" value={plan.physio_subarea?.name} />
                                {(plan.start_date || plan.end_date) && (
                                    <div className="space-y-1">
                                        <dt className="text-sm font-medium text-muted-foreground">
                                            <Calendar className="mr-1 inline size-3" />
                                            Período
                                        </dt>
                                        <dd className="text-sm">
                                            {formatDate(plan.start_date) || '—'}
                                            {plan.end_date && ` até ${formatDate(plan.end_date)}`}
                                        </dd>
                                    </div>
                                )}
                                {plan.duration_minutes && (
                                    <div className="space-y-1">
                                        <dt className="text-sm font-medium text-muted-foreground">
                                            <Clock className="mr-1 inline size-3" />
                                            Duração Estimada
                                        </dt>
                                        <dd className="text-sm">{plan.duration_minutes} min</dd>
                                    </div>
                                )}
                                <InfoItem label="Responsável" value={plan.clinic_user?.name} />
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </ClinicLayout>
    );
}

function ExerciseCard({ item }: { item: TreatmentPlan['exercises'] extends (infer T)[] | undefined ? T : never }) {
    if (!item) return null;
    const exercise = item.exercise;
    if (!exercise) return null;

    return (
        <div className="rounded-lg border border-sidebar-border/70 p-4">
            <div className="mb-2 flex items-start justify-between">
                <div>
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">
                        {exercise.physio_area?.name}
                        {exercise.body_region && ` | ${exercise.body_region.name}`}
                    </p>
                </div>
                {exercise.videos && exercise.videos.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                        Vídeo
                    </Badge>
                )}
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {(item.sets_min || item.sets_max) && (
                    <span>
                        <Repeat className="mr-1 inline size-3" />
                        {item.sets_min === item.sets_max ? `${item.sets_min} séries` : `${item.sets_min || '—'}-${item.sets_max || '—'} séries`}
                    </span>
                )}
                {(item.repetitions_min || item.repetitions_max) && (
                    <span>
                        {item.repetitions_min === item.repetitions_max
                            ? `${item.repetitions_min} reps`
                            : `${item.repetitions_min || '—'}-${item.repetitions_max || '—'} reps`}
                    </span>
                )}
                {(item.load_min || item.load_max) && (
                    <span>
                        {item.load_min === item.load_max ? `${item.load_min} kg` : `${item.load_min || '—'}-${item.load_max || '—'} kg`}
                    </span>
                )}
                {item.rest_time && (
                    <span>
                        <Clock className="mr-1 inline size-3" />
                        {item.rest_time}
                    </span>
                )}
                {item.period && <span>{PERIOD_LABELS[item.period] || item.period}</span>}
            </div>

            {item.days_of_week && item.days_of_week.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {item.days_of_week.map((day) => (
                        <Badge key={day} variant="secondary" className="text-xs">
                            {DAY_LABELS[day] || day}
                        </Badge>
                    ))}
                </div>
            )}

            {item.notes && <p className="mt-2 text-xs italic text-muted-foreground">{item.notes}</p>}
        </div>
    );
}
