import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    Dumbbell,
    FileText,
    Pencil,
    Repeat,
    Trash2,
} from 'lucide-react';
import { useCallback } from 'react';

import FlashMessage from '@/components/flash-message';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Exercise } from '@/types';

const DIFFICULTY_COLORS: Record<string, string> = {
    easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const DIFFICULTY_LABELS: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
};

const MOVEMENT_FORM_LABELS: Record<string, string> = {
    alternado: 'Alternado',
    bilateral: 'Bilateral',
    unilateral: 'Unilateral',
};

const VIDEO_STATUS_LABELS: Record<string, string> = {
    pending: 'Pendente',
    processing: 'Processando',
    completed: 'Concluído',
    failed: 'Falhou',
};

const VIDEO_STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

interface ShowExerciseProps {
    exercise: Exercise;
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

function TextBlock({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
            <dd className="whitespace-pre-line text-sm">{value}</dd>
        </div>
    );
}

export default function Show({ exercise }: ShowExerciseProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/dashboard' },
        { title: 'Exercícios', href: '/admin/exercises' },
        { title: exercise.name, href: `/admin/exercises/${exercise.id}` },
    ];

    const handleDelete = useCallback(() => {
        if (confirm(`Tem certeza que deseja remover "${exercise.name}"?`)) {
            router.delete(`/admin/exercises/${exercise.id}`);
        }
    }, [exercise.id, exercise.name]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={exercise.name} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <FlashMessage />

                {/* Cabeçalho */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/exercises">
                            <Button variant="ghost" size="icon" className="shrink-0">
                                <ArrowLeft className="size-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{exercise.name}</h1>
                            <p className="text-sm text-muted-foreground">
                                ID: {exercise.id} | Criado em: {exercise.created_at}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/admin/exercises/${exercise.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 size-4" />
                                Editar
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 size-4" />
                            Remover
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Coluna Principal */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* Classificação */}
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold">Classificação</h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <InfoItem label="Área da Fisioterapia" value={exercise.physio_area?.name} />
                                <InfoItem label="Subárea" value={exercise.physio_subarea?.name} />
                                <InfoItem label="Região do Corpo" value={exercise.body_region?.name} />
                                <div className="space-y-1">
                                    <dt className="text-sm font-medium text-muted-foreground">Dificuldade</dt>
                                    <dd>
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${DIFFICULTY_COLORS[exercise.difficulty_level] || ''}`}>
                                            {DIFFICULTY_LABELS[exercise.difficulty_level] || exercise.difficulty_level}
                                        </span>
                                    </dd>
                                </div>
                                <InfoItem label="Objetivo Terapêutico" value={exercise.therapeutic_goal} />
                            </div>
                        </div>

                        {/* Descrição */}
                        {exercise.description && (
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                <h2 className="mb-4 text-lg font-semibold">
                                    <FileText className="mr-2 inline size-5" />
                                    Descrição Passo a Passo
                                </h2>
                                <p className="whitespace-pre-line text-sm">{exercise.description}</p>
                            </div>
                        )}

                        {/* Detalhes do Movimento */}
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold">
                                <Dumbbell className="mr-2 inline size-5" />
                                Detalhes do Movimento
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <InfoItem label="Grupo Muscular" value={exercise.muscle_group} />
                                <InfoItem label="Tipo de Movimento" value={exercise.movement_type} />
                                <InfoItem label="Forma de Movimento" value={MOVEMENT_FORM_LABELS[exercise.movement_form || '']} />
                                <InfoItem label="Cadeia Cinética" value={exercise.kinetic_chain} />
                                <InfoItem label="Decúbito" value={exercise.decubitus} />
                            </div>
                        </div>

                        {/* Indicações Clínicas */}
                        {(exercise.indications || exercise.contraindications || exercise.clinical_notes) && (
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                <h2 className="mb-4 text-lg font-semibold">Indicações Clínicas</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <TextBlock label="Indicações" value={exercise.indications} />
                                    <TextBlock label="Contraindicações" value={exercise.contraindications} />
                                </div>
                                {exercise.clinical_notes && (
                                    <div className="mt-4">
                                        <TextBlock label="Observações Clínicas" value={exercise.clinical_notes} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                        {/* Prescrição Padrão */}
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold">
                                <Repeat className="mr-2 inline size-5" />
                                Prescrição Padrão
                            </h2>
                            <dl className="space-y-3">
                                <InfoItem label="Frequência" value={exercise.frequency} />
                                <InfoItem label="Séries" value={exercise.sets != null ? String(exercise.sets) : null} />
                                <InfoItem label="Repetições" value={exercise.repetitions != null ? String(exercise.repetitions) : null} />
                                {exercise.rest_time != null && (
                                    <div className="space-y-1">
                                        <dt className="text-sm font-medium text-muted-foreground">
                                            <Clock className="mr-1 inline size-3" />
                                            Descanso
                                        </dt>
                                        <dd className="text-sm">{exercise.rest_time}s</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {/* Vídeos */}
                        {exercise.videos && exercise.videos.length > 0 && (
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                <h2 className="mb-4 text-lg font-semibold">Vídeos</h2>
                                <div className="space-y-3">
                                    {exercise.videos.map((video) => (
                                        <div key={video.id} className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{video.original_filename}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{video.human_size}</span>
                                                    {video.human_duration && <span>{video.human_duration}</span>}
                                                </div>
                                            </div>
                                            <span className={`ml-2 inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${VIDEO_STATUS_COLORS[video.status] || ''}`}>
                                                {VIDEO_STATUS_LABELS[video.status] || video.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
