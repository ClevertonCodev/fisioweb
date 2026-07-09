import {
    ArrowRight,
    Check,
    ChevronDown,
    ChevronUp,
    CirclePlus,
    Search,
    Star,
    Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { VideoThumb } from '@/components/VideoThumb';
import type { Exercise, ProgramGroup } from '@/domain/clinic';
import { cn } from '@/lib/utils';

interface StepSelectExercisesProps {
    exercises: Exercise[];
    selectedIds: string[];
    groups: ProgramGroup[];
    targetGroupId: string | null;
    onToggleSelect: (exercise: Exercise) => void;
    onRemove: (exerciseId: string) => void;
    onRemoveFromGroup: (groupId: string, exerciseId: string) => void;
    onSetTargetGroup: (groupId: string) => void;
    onNext: () => void;
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
}

export function StepSelectExercises({
    exercises,
    selectedIds,
    groups,
    targetGroupId,
    onToggleSelect,
    onRemove,
    onRemoveFromGroup,
    onSetTargetGroup,
    onNext,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
}: StepSelectExercisesProps) {
    const [search, setSearch] = useState('');
    const [showFavorites, setShowFavorites] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
        new Set(),
    );
    const gridRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        const container = gridRef.current;
        if (!sentinel || !container) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    fetchNextPage();
                }
            },
            { root: container, threshold: 0.1 },
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, exercises.length]);

    const filtered = useMemo(() => {
        return exercises.filter((ex) => {
            if (
                search &&
                !ex.title.toLowerCase().includes(search.toLowerCase())
            )
                return false;
            if (showFavorites && !ex.isFavorite) return false;
            return true;
        });
    }, [exercises, search, showFavorites]);

    const hasGroups = groups.length > 0;
    const totalGroupExercises = groups.reduce(
        (sum, g) => sum + g.exercises.length,
        0,
    );
    const selectedExercises = exercises.filter((ex) =>
        selectedIds.includes(ex.id),
    );
    const showSidebar = hasGroups
        ? totalGroupExercises > 0 || groups.length > 0
        : selectedExercises.length > 0;

    const toggleGroupCollapse = (groupId: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    return (
        <div className="flex h-full">
            {/* Main - exercise grid */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Search & filters */}
                <div className="flex items-center gap-3 border-b border-border px-6 py-4">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant={showFavorites ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setShowFavorites(!showFavorites)}
                        className="gap-2"
                    >
                        <Star
                            className={cn(
                                'h-4 w-4',
                                showFavorites && 'fill-warning text-warning',
                            )}
                        />
                        Favoritos
                    </Button>
                </div>

                {/* Grid */}
                <div ref={gridRef} className="flex-1 overflow-auto p-6">
                    <div
                        className={cn(
                            'grid gap-4',
                            showSidebar
                                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-3'
                                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
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
                    <div ref={sentinelRef} className="h-4" />
                </div>
            </div>

            {/* Right sidebar */}
            {showSidebar && (
                <div className="flex w-80 flex-shrink-0 flex-col border-l border-border bg-card">
                    {/* Header */}
                    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                        {hasGroups ? (
                            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <ArrowRight className="h-4 w-4" />
                                {totalGroupExercises} exercício
                                {totalGroupExercises !== 1 ? 's' : ''}{' '}
                                selecionado
                                {totalGroupExercises !== 1 ? 's' : ''}
                            </span>
                        ) : (
                            <span className="text-sm font-medium text-foreground">
                                {selectedIds.length} exercício
                                {selectedIds.length !== 1 ? 's' : ''}{' '}
                                selecionado
                                {selectedIds.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {hasGroups ? (
                            /* Grouped sidebar */
                            <div className="p-2">
                                {groups.map((group) => {
                                    const isCollapsed = collapsedGroups.has(
                                        group.id,
                                    );
                                    const isTarget = targetGroupId === group.id;
                                    return (
                                        <div key={group.id} className="mb-4">
                                            {/* Group header */}
                                            <div className="flex items-center gap-2 px-2 py-1">
                                                <span className="text-sm font-semibold text-foreground">
                                                    {group.name}
                                                </span>
                                                <Badge className="flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs">
                                                    {group.exercises.length}
                                                </Badge>
                                                <div className="flex-1" />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() =>
                                                        toggleGroupCollapse(
                                                            group.id,
                                                        )
                                                    }
                                                >
                                                    {isCollapsed ? (
                                                        <ChevronDown className="h-3 w-3" />
                                                    ) : (
                                                        <ChevronUp className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>

                                            {!isCollapsed && (
                                                <>
                                                    {group.exercises.map(
                                                        (ex) => (
                                                            <div
                                                                key={ex.id}
                                                                className="flex items-center gap-3 rounded-md p-2 hover:bg-accent/50"
                                                            >
                                                                <div className="h-14 w-24 flex-shrink-0 overflow-hidden rounded bg-muted">
                                                                    <img
                                                                        src={
                                                                            ex.thumbnailUrl
                                                                        }
                                                                        alt={
                                                                            ex.title
                                                                        }
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                </div>
                                                                <p className="line-clamp-2 flex-1 text-xs font-medium text-foreground">
                                                                    {ex.title}
                                                                </p>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        onRemoveFromGroup(
                                                                            group.id,
                                                                            ex.id,
                                                                        );
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ),
                                                    )}

                                                    {/* Add exercises to this group */}
                                                    <button
                                                        onClick={() =>
                                                            onSetTargetGroup(
                                                                group.id,
                                                            )
                                                        }
                                                        className={cn(
                                                            'mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed py-3 text-xs transition-colors',
                                                            isTarget
                                                                ? 'border-primary bg-primary/5 text-primary'
                                                                : 'border-border text-muted-foreground hover:border-muted-foreground hover:text-foreground',
                                                        )}
                                                    >
                                                        <CirclePlus className="h-4 w-4" />
                                                        <span>
                                                            Adicionar exercícios
                                                            nesse grupo
                                                        </span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Flat sidebar (no groups yet) */
                            <div className="space-y-1 p-2">
                                {selectedExercises.map((ex) => (
                                    <div
                                        key={ex.id}
                                        className="flex items-center gap-3 rounded-md p-2 hover:bg-accent/50"
                                    >
                                        <div className="h-14 w-24 flex-shrink-0 overflow-hidden rounded bg-muted">
                                            <img
                                                src={
                                                    ex.thumbnailUrl ?? undefined
                                                }
                                                alt={ex.title}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <p className="line-clamp-2 flex-1 text-xs font-medium text-foreground">
                                            {ex.title}
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
                                ))}
                            </div>
                        )}
                    </div>

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
    exercise: Exercise;
    isSelected: boolean;
    onToggleSelect: () => void;
}) {
    return (
        <div
            className={cn(
                'group relative flex flex-col overflow-hidden rounded-lg border bg-card text-left transition-all duration-200',
                isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-muted-foreground/30',
            )}
        >
            {/* Thumbnail with play — vídeo quadrado com respiro, igual à biblioteca */}
            <div className="relative mx-3 mt-3 aspect-square overflow-hidden rounded-lg bg-muted">
                <VideoThumb
                    videoUrl={exercise.videoUrl}
                    thumbnailUrl={exercise.thumbnailUrl}
                />

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

                {/* Favorite star */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                                'absolute top-2 right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-all',
                                exercise.isFavorite
                                    ? 'bg-warning/20 text-warning'
                                    : 'bg-background/60 text-muted-foreground opacity-0 backdrop-blur-sm group-hover:opacity-100 hover:text-warning',
                            )}
                        >
                            <Star
                                className={cn(
                                    'h-3.5 w-3.5',
                                    exercise.isFavorite && 'fill-warning',
                                )}
                            />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {exercise.isFavorite
                            ? 'Remover dos favoritos'
                            : 'Favoritar'}
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="p-3">
                <p className="line-clamp-2 text-[11px] leading-snug font-medium text-card-foreground">
                    {exercise.title}
                </p>
                {exercise.specialty && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {exercise.specialty}
                    </p>
                )}
            </div>
        </div>
    );
}
