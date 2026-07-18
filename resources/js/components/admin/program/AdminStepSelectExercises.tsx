import { Check, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { AdminExercise } from '@/application/admin/ports';
import { ExerciseCardSkeleton } from '@/components/ExerciseCardSkeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VideoThumb } from '@/components/VideoThumb';
import { cn } from '@/lib/utils';

interface AdminStepSelectExercisesProps {
    exercises: AdminExercise[];
    isLoading?: boolean;
    selectedIds: number[];
    onToggleSelect: (exercise: AdminExercise) => void;
    onRemove: (exerciseId: number) => void;
    onNext: () => void;
}

export function AdminStepSelectExercises({
    exercises,
    isLoading,
    selectedIds,
    onToggleSelect,
    onRemove,
    onNext,
}: AdminStepSelectExercisesProps) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        if (!search) return exercises;
        return exercises.filter((ex) =>
            ex.name.toLowerCase().includes(search.toLowerCase()),
        );
    }, [exercises, search]);

    const selectedExercises = exercises.filter((ex) =>
        selectedIds.includes(ex.id),
    );
    const hasSelectedExercises = selectedExercises.length > 0;

    return (
        <div className="flex h-full">
            {/* Main - exercise grid */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Search */}
                <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar exercício"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Grid */}
                <ScrollArea className="flex-1 p-6">
                    {isLoading ? (
                        <div
                            className={cn(
                                'grid gap-4',
                                hasSelectedExercises
                                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
                            )}
                        >
                            {Array.from({ length: 10 }).map((_, i) => (
                                <ExerciseCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
                            Nenhum exercício encontrado.
                        </div>
                    ) : (
                        <div
                            className={cn(
                                'grid gap-4',
                                hasSelectedExercises
                                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
                            )}
                        >
                            {filtered.map((exercise) => {
                                const isSelected = selectedIds.includes(
                                    exercise.id,
                                );
                                return (
                                    <ExerciseSelectCard
                                        key={exercise.id}
                                        exercise={exercise}
                                        isSelected={isSelected}
                                        onToggleSelect={() =>
                                            onToggleSelect(exercise)
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Right sidebar - selected exercises */}
            {hasSelectedExercises && (
                <div className="flex w-80 flex-shrink-0 flex-col border-l border-border bg-card">
                    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                        <span className="text-sm font-medium text-foreground">
                            {selectedIds.length} exercício
                            {selectedIds.length !== 1 ? 's' : ''} selecionado
                            {selectedIds.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="space-y-1 p-2">
                            {selectedExercises.map((ex) => {
                                const video = (
                                    ex.videos as
                                        | {
                                              thumbnail_url?: string | null;
                                              cdn_url?: string | null;
                                              url?: string | null;
                                          }[]
                                        | undefined
                                )?.[0];
                                return (
                                    <div
                                        key={ex.id}
                                        className="flex items-center gap-3 rounded-md p-2 hover:bg-accent/50"
                                    >
                                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-muted">
                                            <img
                                                src={
                                                    video?.thumbnail_url ??
                                                    undefined
                                                }
                                                alt={ex.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <p className="line-clamp-2 flex-1 text-xs font-medium text-foreground">
                                            {ex.name}
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemove(ex.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </ScrollArea>

                    <div className="border-t border-border p-4">
                        <Button className="w-full" onClick={onNext}>
                            Avançar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function ExerciseSelectCard({
    exercise,
    isSelected,
    onToggleSelect,
}: {
    exercise: AdminExercise;
    isSelected: boolean;
    onToggleSelect: () => void;
}) {
    const video = (
        exercise.videos as
            | {
                  thumbnail_url?: string | null;
                  cdn_url?: string | null;
                  url?: string | null;
              }[]
            | undefined
    )?.[0];
    const videoUrl = video?.cdn_url ?? video?.url ?? undefined;
    const thumbnailUrl = video?.thumbnail_url ?? undefined;

    return (
        <div
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-all duration-200',
                isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-muted-foreground/30',
            )}
        >
            {/* Thumbnail with play */}
            <div className="relative aspect-square overflow-hidden bg-muted">
                <VideoThumb videoUrl={videoUrl} thumbnailUrl={thumbnailUrl} />

                {/* Select overlay */}
                <button
                    onClick={onToggleSelect}
                    className="absolute top-2 left-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 transition-colors"
                    style={{
                        backgroundColor: isSelected
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--background) / 0.6)',
                        borderColor: isSelected
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--border))',
                    }}
                >
                    {isSelected && (
                        <Check className="h-4 w-4 text-primary-foreground" />
                    )}
                </button>
            </div>
            <div className="p-2">
                <p className="line-clamp-2 text-xs font-medium text-card-foreground">
                    {exercise.name}
                </p>
            </div>
        </div>
    );
}
