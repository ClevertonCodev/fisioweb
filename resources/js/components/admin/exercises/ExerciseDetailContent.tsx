import { Clock, Dumbbell, FileText, Repeat } from 'lucide-react';

import {
    DIFFICULTY_COLORS,
    DIFFICULTY_LABELS,
    MOVEMENT_FORM_LABELS,
    VIDEO_STATUS_COLORS,
    VIDEO_STATUS_LABELS,
} from '@/application/admin';
import type { AdminExercise } from '@/application/admin/ports';
import { Card, CardContent } from '@/components/ui/card';

interface VideoItem {
    id: number;
    original_filename?: string;
    human_size?: string;
    human_duration?: string | null;
    status?: string;
}

function InfoItem({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    if (value == null || value === '') return null;
    return (
        <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">
                {label}
            </dt>
            <dd className="text-sm">{value}</dd>
        </div>
    );
}

function TextBlock({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    if (!value) return null;
    return (
        <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">
                {label}
            </dt>
            <dd className="text-sm whitespace-pre-line">{value}</dd>
        </div>
    );
}

interface ExerciseDetailContentProps {
    exercise: AdminExercise;
}

export function ExerciseDetailContent({
    exercise,
}: ExerciseDetailContentProps) {
    const videos = (exercise.videos ?? []) as VideoItem[];

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold">
                            Classificação
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <InfoItem
                                label="Área da Fisioterapia"
                                value={exercise.physio_area?.name}
                            />
                            <InfoItem
                                label="Subárea"
                                value={exercise.physio_subarea?.name}
                            />
                            <InfoItem
                                label="Região do Corpo"
                                value={exercise.body_region?.name}
                            />
                            <div className="space-y-1">
                                <dt className="text-sm font-medium text-muted-foreground">
                                    Dificuldade
                                </dt>
                                <dd>
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${DIFFICULTY_COLORS[exercise.difficulty_level] ?? ''}`}
                                    >
                                        {DIFFICULTY_LABELS[
                                            exercise.difficulty_level
                                        ] ?? exercise.difficulty_level}
                                    </span>
                                </dd>
                            </div>
                            <InfoItem
                                label="Objetivo Terapêutico"
                                value={exercise.therapeutic_goal}
                            />
                        </div>
                    </CardContent>
                </Card>

                {exercise.description && (
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-4 flex items-center border-b border-border pb-2 text-lg font-semibold">
                                <FileText className="mr-2 h-5 w-5" />
                                Descrição Passo a Passo
                            </h2>
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {exercise.description}
                            </p>
                        </CardContent>
                    </Card>
                )}

                {exercise.audio_description && (
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold">
                                Descrição em Áudio
                            </h2>
                            <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                                {exercise.audio_description}
                            </p>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 flex items-center border-b border-border pb-2 text-lg font-semibold">
                            <Dumbbell className="mr-2 h-5 w-5" />
                            Detalhes do Movimento
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <InfoItem
                                label="Grupo Muscular"
                                value={exercise.muscle_group}
                            />
                            <InfoItem
                                label="Tipo de Movimento"
                                value={exercise.movement_type}
                            />
                            <InfoItem
                                label="Forma de Movimento"
                                value={
                                    exercise.movement_form
                                        ? (MOVEMENT_FORM_LABELS[
                                              exercise.movement_form
                                          ] ?? exercise.movement_form)
                                        : null
                                }
                            />
                            <InfoItem
                                label="Cadeia Cinética"
                                value={exercise.kinetic_chain}
                            />
                            <InfoItem
                                label="Decúbito"
                                value={exercise.decubitus}
                            />
                        </div>
                    </CardContent>
                </Card>

                {(exercise.indications ||
                    exercise.contraindications ||
                    exercise.clinical_notes) && (
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold">
                                Indicações Clínicas
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <TextBlock
                                    label="Indicações"
                                    value={exercise.indications}
                                />
                                <TextBlock
                                    label="Contraindicações"
                                    value={exercise.contraindications}
                                />
                            </div>
                            {exercise.clinical_notes && (
                                <div className="mt-4">
                                    <TextBlock
                                        label="Observações Clínicas"
                                        value={exercise.clinical_notes}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="space-y-6">
                <Card>
                    <CardContent className="p-6">
                        <h2 className="mb-4 flex items-center border-b border-border pb-2 text-lg font-semibold">
                            <Repeat className="mr-2 h-5 w-5" />
                            Prescrição Padrão
                        </h2>
                        <dl className="space-y-3">
                            <InfoItem
                                label="Frequência"
                                value={exercise.frequency}
                            />
                            <InfoItem
                                label="Séries"
                                value={
                                    exercise.sets != null
                                        ? String(exercise.sets)
                                        : null
                                }
                            />
                            <InfoItem
                                label="Repetições"
                                value={
                                    exercise.repetitions != null
                                        ? String(exercise.repetitions)
                                        : null
                                }
                            />
                            {exercise.rest_time != null && (
                                <div className="space-y-1">
                                    <dt className="flex items-center text-sm font-medium text-muted-foreground">
                                        <Clock className="mr-1 h-3 w-3" />
                                        Descanso
                                    </dt>
                                    <dd className="text-sm">
                                        {exercise.rest_time}s
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                {videos.length > 0 && (
                    <Card>
                        <CardContent className="p-6">
                            <h2 className="mb-4 border-b border-border pb-2 text-lg font-semibold">
                                Vídeos
                            </h2>
                            <div className="space-y-3">
                                {videos.map((video) => (
                                    <div
                                        key={video.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {video.original_filename ??
                                                    `Vídeo ${video.id}`}
                                            </p>
                                            <div className="flex gap-2 text-xs text-muted-foreground">
                                                {video.human_size && (
                                                    <span>
                                                        {video.human_size}
                                                    </span>
                                                )}
                                                {video.human_duration && (
                                                    <span>
                                                        {video.human_duration}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {video.status && (
                                            <span
                                                className={`ml-2 inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${VIDEO_STATUS_COLORS[video.status] ?? ''}`}
                                            >
                                                {VIDEO_STATUS_LABELS[
                                                    video.status
                                                ] ?? video.status}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
