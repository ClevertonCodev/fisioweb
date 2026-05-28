import { ArrowLeft, Pencil } from 'lucide-react';
import { useLoaderData, useNavigate } from 'react-router-dom';

import { AdminLayout } from '@/components/admin/AdminLayout';
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
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/admin/programas')}
                    className="text-muted-foreground hover:text-foreground gap-1"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Button>

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">Modelo</Badge>
                            {!program.isActive && (
                                <Badge variant="outline" className="text-muted-foreground">
                                    Inativo
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-foreground text-2xl font-semibold">{program.title}</h1>
                        {program.description && (
                            <p className="text-muted-foreground text-sm">{program.description}</p>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/programas/${program.id}/editar`)}
                    >
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                </div>

                {/* Info card */}
                <Card>
                    <CardContent className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3">
                        <div>
                            <p className="text-muted-foreground text-xs">Área</p>
                            <p className="text-foreground text-sm font-medium">
                                {program.physioArea?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Duração</p>
                            <p className="text-foreground text-sm font-medium">
                                {program.durationMinutes ? `${program.durationMinutes} min` : '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Criado por</p>
                            <p className="text-foreground text-sm font-medium">
                                {program.createdBy?.name ?? '—'}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Exercícios</p>
                            <p className="text-foreground text-sm font-medium">
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
                        <h2 className="text-foreground text-lg font-semibold">Exercícios</h2>
                        {program.groups.map((group) => (
                            <Card key={group.id}>
                                <CardHeader className="pt-4 pb-2">
                                    <CardTitle className="text-base">{group.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pb-4">
                                    {group.exercises?.map((ex) => (
                                        <div
                                            key={ex.id}
                                            className="border-border flex items-center gap-4 rounded-lg border p-3"
                                        >
                                            {/* Thumbnail */}
                                            <div className="bg-muted h-16 w-24 flex-shrink-0 overflow-hidden rounded-md">
                                                {ex.exercise?.videoUrl ? (
                                                    <video
                                                        src={ex.exercise.videoUrl}
                                                        poster={
                                                            ex.exercise.thumbnailUrl ?? undefined
                                                        }
                                                        className="h-full w-full object-cover"
                                                        playsInline
                                                    />
                                                ) : ex.exercise?.thumbnailUrl ? (
                                                    <img
                                                        src={ex.exercise.thumbnailUrl}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : null}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-foreground text-sm font-medium">
                                                    {ex.exercise?.name ??
                                                        `Exercício ${ex.exerciseId}`}
                                                </p>
                                                <div className="text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                                    {ex.daysOfWeek && ex.daysOfWeek.length > 0 && (
                                                        <span>{formatDays(ex.daysOfWeek)}</span>
                                                    )}
                                                    {ex.period && (
                                                        <span>{PERIOD_LABELS[ex.period]}</span>
                                                    )}
                                                    {ex.setsMin != null && (
                                                        <span>
                                                            {ex.setsMin}
                                                            {ex.setsMax && ex.setsMax !== ex.setsMin
                                                                ? `–${ex.setsMax}`
                                                                : ''}{' '}
                                                            séries
                                                        </span>
                                                    )}
                                                    {ex.repetitionsMin != null && (
                                                        <span>
                                                            {ex.repetitionsMin}
                                                            {ex.repetitionsMax &&
                                                            ex.repetitionsMax !== ex.repetitionsMin
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
