import { Check, Loader2, X } from 'lucide-react';

import { usePendingExercises, useReviewExercise } from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';

const difficultyLabels: Record<string, string> = {
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',
};

export default function AdminExerciseReviewPage() {
    const { data: pending = [], isLoading } = usePendingExercises();
    const { approve, reject } = useReviewExercise();

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="flex items-center justify-between gap-4 px-6 py-4">
                        <h1 className="text-2xl font-semibold text-foreground">
                            Exercícios a revisar
                        </h1>
                        <BackButton
                            to="/admin/exercicios"
                            className="shrink-0"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : pending.length === 0 ? (
                        <p className="py-16 text-center text-muted-foreground">
                            Nenhum exercício aguardando revisão.
                        </p>
                    ) : (
                        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2">
                            {pending.map((exercise) => {
                                const video =
                                    exercise.videos.find(
                                        (v) => v.status === 'completed',
                                    ) ?? exercise.videos[0];
                                const isBusy =
                                    approve.isPending || reject.isPending;
                                return (
                                    <div
                                        key={exercise.id}
                                        className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
                                    >
                                        <video
                                            src={
                                                video?.cdn_url ??
                                                video?.url ??
                                                undefined
                                            }
                                            poster={
                                                video?.thumbnail_url ??
                                                undefined
                                            }
                                            controls
                                            className="aspect-video w-full bg-muted object-cover"
                                        />
                                        <div className="flex flex-1 flex-col gap-2 p-4">
                                            <h3 className="font-semibold text-foreground">
                                                {exercise.name}
                                            </h3>
                                            <div className="text-sm text-muted-foreground">
                                                <p>
                                                    Categoria:{' '}
                                                    {exercise.physio_area
                                                        ?.name ?? '—'}{' '}
                                                    · Dificuldade:{' '}
                                                    {difficultyLabels[
                                                        exercise
                                                            .difficulty_level
                                                    ] ??
                                                        exercise.difficulty_level}
                                                </p>
                                                <p>
                                                    Clínica:{' '}
                                                    {exercise.clinic?.name ??
                                                        '—'}
                                                    {exercise
                                                        .submitted_by_clinic_user
                                                        ?.name
                                                        ? ` · por ${exercise.submitted_by_clinic_user.name}`
                                                        : ''}
                                                </p>
                                            </div>
                                            {exercise.description && (
                                                <p className="text-sm text-foreground">
                                                    {exercise.description}
                                                </p>
                                            )}
                                            <div className="mt-auto flex gap-2 pt-2">
                                                <Button
                                                    size="sm"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        approve.mutate(
                                                            exercise.id,
                                                        )
                                                    }
                                                    className="gap-1"
                                                >
                                                    <Check className="size-4" />
                                                    Aprovar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={isBusy}
                                                    onClick={() =>
                                                        reject.mutate({
                                                            id: exercise.id,
                                                        })
                                                    }
                                                    className="gap-1 text-destructive hover:text-destructive"
                                                >
                                                    <X className="size-4" />
                                                    Rejeitar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
