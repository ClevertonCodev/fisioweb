import { Pencil } from 'lucide-react';
import { useLoaderData, useNavigate } from 'react-router-dom';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminProgram } from '@/domain/admin';

const PERIOD_LABELS: Record<string, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    night: 'Noite',
};

const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function formatDays(days: number[] | null): string {
    if (!days || days.length === 0) return '—';
    if (days.length === 7) return 'Todos os dias';
    return days.map((d) => DAY_LABELS[d]).join(', ');
}

export default function ProgramDetailPage() {
    const navigate = useNavigate();
    const program = useLoaderData() as AdminProgram;

    return (
        <AdminLayout>
            <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">Modelo</Badge>
                            {!program.isActive && (
                                <Badge
                                    variant="outline"
                                    className="text-muted-foreground"
                                >
                                    Inativo
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-2xl font-semibold text-foreground">
                            {program.title}
                        </h1>
                        {program.description && (
                            <p className="text-sm text-muted-foreground">
                                {program.description}
                            </p>
                        )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <BackButton
                            to="/admin/programas"
                            className="shrink-0"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                navigate(
                                    `/admin/programas/${program.id}/editar`,
                                )
                            }
                        >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                        </Button>
                    </div>
                </div>

                {/* Info card */}
                <Card>
                    <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Área
                            </p>
                            <p className="text-sm font-medium text-foreground">
                                {program.physioArea?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Duração
                            </p>
                            <p className="text-sm font-medium text-foreground">
                                {program.durationMinutes
                                    ? `${program.durationMinutes} min`
                                    : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Criado por
                            </p>
                            <p className="text-sm font-medium text-foreground">
                                {program.createdBy?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Exercícios
                            </p>
                            <p className="text-sm font-medium text-foreground">
                                {program.groups?.reduce(
                                    (s, g) => s + (g.exercises?.length ?? 0),
                                    0,
                                ) ?? 0}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Groups */}
                {program.groups && program.groups.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-foreground">
                            Exercícios
                        </h2>
                        {program.groups.map((group) => (
                            <Card key={group.id}>
                                <CardHeader className="pt-4 pb-2">
                                    <CardTitle className="text-base">
                                        {group.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-4">
                                    {group.exercises?.map((ex) => (
                                        <div
                                            key={ex.id}
                                            className="flex items-center gap-4 rounded-lg border border-border p-3"
                                        >
                                            {/* Thumbnail */}
                                            <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                                                {ex.exercise?.videoUrl ? (
                                                    <video
                                                        src={
                                                            ex.exercise.videoUrl
                                                        }
                                                        poster={
                                                            ex.exercise
                                                                .thumbnailUrl ??
                                                            undefined
                                                        }
                                                        className="h-full w-full object-cover"
                                                        playsInline
                                                    />
                                                ) : ex.exercise
                                                      ?.thumbnailUrl ? (
                                                    <img
                                                        src={
                                                            ex.exercise
                                                                .thumbnailUrl
                                                        }
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : null}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-foreground">
                                                    {ex.exercise?.name ??
                                                        `Exercício ${ex.exerciseId}`}
                                                </p>
                                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                    {ex.daysOfWeek &&
                                                        ex.daysOfWeek.length >
                                                            0 && (
                                                            <span>
                                                                {formatDays(
                                                                    ex.daysOfWeek,
                                                                )}
                                                            </span>
                                                        )}
                                                    {ex.period && (
                                                        <span>
                                                            {
                                                                PERIOD_LABELS[
                                                                    ex.period
                                                                ]
                                                            }
                                                        </span>
                                                    )}
                                                    {ex.setsMin != null && (
                                                        <span>
                                                            {ex.setsMin}
                                                            {ex.setsMax &&
                                                            ex.setsMax !==
                                                                ex.setsMin
                                                                ? `–${ex.setsMax}`
                                                                : ''}{' '}
                                                            séries
                                                        </span>
                                                    )}
                                                    {ex.repetitionsMin !=
                                                        null && (
                                                        <span>
                                                            {ex.repetitionsMin}
                                                            {ex.repetitionsMax &&
                                                            ex.repetitionsMax !==
                                                                ex.repetitionsMin
                                                                ? `–${ex.repetitionsMax}`
                                                                : ''}{' '}
                                                            reps
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
