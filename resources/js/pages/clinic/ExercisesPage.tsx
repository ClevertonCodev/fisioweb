import { Plus, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    useInfiniteExercises,
    useToggleExerciseFavorite,
} from '@/application/clinic';
import { can } from '@/application/clinic/permissions';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { ExerciseFilters } from '@/components/clinic/ExerciseFilters';
import { VideoPlayerModal } from '@/components/clinic/VideoPlayerModal';
import { ExerciseCard } from '@/components/ExerciseCard';
import { ExerciseCardSkeleton } from '@/components/ExerciseCardSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type {
    Exercise,
    FilterCategory,
    ExerciseFilters as Filters,
} from '@/domain/clinic';
import { cn } from '@/lib/utils';

const initialFilters: Filters = {
    search: '',
    specialty: [],
    bodyArea: [],
    bodyRegion: [],
    objective: [],
    difficulty: [],
    muscleGroup: [],
    equipment: [],
    movementType: [],
    movementPattern: [],
    movementForm: [],
};

interface ExercisesPageProps {
    embedded?: boolean;
}

export default function ExercisesPage({
    embedded = false,
}: ExercisesPageProps) {
    const navigate = useNavigate();
    const { user } = useAuth();
    const canSubmit = can.manageUsers(user?.role as ClinicRole | undefined);
    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
        useInfiniteExercises();
    const toggleFavoriteMutation = useToggleExerciseFavorite();
    const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<string>>(
        new Set(),
    );
    const [showFilters, setShowFilters] = useState(false);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
        null,
    );
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const allExercises = useMemo(
        () => data?.pages.flatMap((p) => p.items) ?? [],
        [data],
    );

    const selectedExercise = useMemo(
        () => exercises.find((e) => e.id === selectedExerciseId) ?? null,
        [exercises, selectedExerciseId],
    );

    useEffect(() => {
        if (allExercises.length > 0) {
            setExercises((prev) => {
                // Merge: keep optimistic favorite state for already-known exercises
                const prevMap = new Map(prev.map((e) => [e.id, e]));
                return allExercises.map((e) => prevMap.get(e.id) ?? e);
            });
        }
    }, [allExercises]);

    // Infinite scroll via IntersectionObserver
    useEffect(() => {
        const sentinel = sentinelRef.current;
        const container = scrollContainerRef.current;
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

    const filterCategories = useMemo((): FilterCategory[] => {
        const diffLabels: Record<string, string> = {
            facil: 'Fácil',
            medio: 'Médio',
            dificil: 'Difícil',
        };

        const makeCategory = (
            id: keyof Omit<Filters, 'search'>,
            label: string,
            getValue: (e: Exercise) => string,
            getLabel?: (v: string) => string,
        ): FilterCategory => {
            const counts: Record<string, number> = {};
            for (const ex of exercises) {
                const val = getValue(ex);
                if (val) counts[val] = (counts[val] ?? 0) + 1;
            }
            return {
                id,
                label,
                options: Object.entries(counts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([value, count]) => ({
                        value,
                        label: getLabel ? getLabel(value) : value,
                        count,
                    })),
            };
        };

        return [
            makeCategory('specialty', 'Especialidade', (e) => e.specialty),
            makeCategory('bodyArea', 'Área do Corpo', (e) => e.bodyArea),
            makeCategory('bodyRegion', 'Região do Corpo', (e) => e.bodyRegion),
            makeCategory('objective', 'Objetivo', (e) => e.objective),
            makeCategory(
                'difficulty',
                'Dificuldade',
                (e) => e.difficulty,
                (v) => diffLabels[v] ?? v,
            ),
            makeCategory('muscleGroup', 'Grupo Muscular', (e) => e.muscleGroup),
            makeCategory('equipment', 'Equipamento', (e) => e.equipment),
            makeCategory(
                'movementType',
                'Tipo de Movimento',
                (e) => e.movementType,
            ),
            makeCategory(
                'movementPattern',
                'Padrão de Movimento',
                (e) => e.movementPattern,
            ),
            makeCategory(
                'movementForm',
                'Forma de Movimento',
                (e) => e.movementForm,
            ),
        ].filter((cat) => cat.options.length > 0);
    }, [exercises]);

    const filteredExercises = useMemo(() => {
        return exercises.filter((exercise) => {
            if (showFavoritesOnly && !exercise.isFavorite) return false;

            if (
                filters.search &&
                !exercise.title
                    .toLowerCase()
                    .includes(filters.search.toLowerCase())
            ) {
                return false;
            }

            const filterChecks: [string[], string][] = [
                [filters.specialty, exercise.specialty],
                [filters.bodyArea, exercise.bodyArea],
                [filters.bodyRegion, exercise.bodyRegion],
                [filters.objective, exercise.objective],
                [filters.difficulty, exercise.difficulty],
                [filters.muscleGroup, exercise.muscleGroup],
                [filters.equipment, exercise.equipment],
                [filters.movementType, exercise.movementType],
                [filters.movementPattern, exercise.movementPattern],
                [filters.movementForm, exercise.movementForm],
            ];

            for (const [filterValues, exerciseValue] of filterChecks) {
                if (
                    filterValues.length > 0 &&
                    !filterValues.includes(exerciseValue)
                ) {
                    return false;
                }
            }

            return true;
        });
    }, [exercises, filters, showFavoritesOnly]);

    const activeFiltersCount = useMemo(() => {
        return Object.entries(filters)
            .filter(([key]) => key !== 'search')
            .reduce(
                (count, [, value]) =>
                    count + (Array.isArray(value) ? value.length : 0),
                0,
            );
    }, [filters]);

    const handleToggleFavorite = (exercise: Exercise) => {
        if (pendingFavoriteIds.has(exercise.id)) return;

        setPendingFavoriteIds((prev) => new Set(prev).add(exercise.id));
        setExercises((prev) =>
            prev.map((ex) =>
                ex.id === exercise.id
                    ? { ...ex, isFavorite: !ex.isFavorite }
                    : ex,
            ),
        );

        toggleFavoriteMutation.mutate(exercise.id, {
            onSuccess: ({ isFavorite }) => {
                setExercises((prev) =>
                    prev.map((ex) =>
                        ex.id === exercise.id ? { ...ex, isFavorite } : ex,
                    ),
                );
            },
            onError: () => {
                setExercises((prev) =>
                    prev.map((ex) =>
                        ex.id === exercise.id
                            ? { ...ex, isFavorite: exercise.isFavorite }
                            : ex,
                    ),
                );
            },
            onSettled: () => {
                setPendingFavoriteIds((prev) => {
                    const next = new Set(prev);
                    next.delete(exercise.id);
                    return next;
                });
            },
        });
    };

    const handleInfo = (exercise: Exercise) => {
        setSelectedExerciseId(exercise.id);
        setIsVideoModalOpen(true);
    };

    const removeFilter = (categoryId: string, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [categoryId]: (
                prev[categoryId as keyof Filters] as string[]
            ).filter((v) => v !== value),
        }));
    };

    const getFilterLabel = (categoryId: string, value: string) => {
        const category = filterCategories.find((c) => c.id === categoryId);
        const option = category?.options.find((o) => o.value === value);
        return option?.label || value;
    };

    const content = (
        <>
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                    <div className="space-y-3 px-4 py-3 sm:px-6 sm:py-4">
                        <h1 className="text-lg font-semibold text-foreground sm:text-2xl">
                            Biblioteca de Exercícios
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative min-w-0 flex-1 basis-full sm:flex-none sm:basis-64">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar"
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            search: e.target.value,
                                        }))
                                    }
                                    className="pl-9"
                                />
                            </div>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={
                                            showFavoritesOnly
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setShowFavoritesOnly(
                                                (prev) => !prev,
                                            )
                                        }
                                        className="cursor-pointer gap-2"
                                        aria-label="Favoritos"
                                    >
                                        <Star
                                            className={cn(
                                                'h-4 w-4',
                                                showFavoritesOnly
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'text-muted-foreground',
                                            )}
                                        />
                                        <span className="hidden sm:inline">
                                            Favoritos
                                        </span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Favoritos</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={
                                            activeFiltersCount > 0
                                                ? 'secondary'
                                                : 'outline'
                                        }
                                        size="icon"
                                        onClick={() => setShowFilters(true)}
                                        className="relative cursor-pointer"
                                        aria-label="Filtros"
                                    >
                                        <SlidersHorizontal className="h-4 w-4" />
                                        {activeFiltersCount > 0 && (
                                            <Badge
                                                variant="default"
                                                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center p-0 text-xs"
                                            >
                                                {activeFiltersCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Filtros</TooltipContent>
                            </Tooltip>
                            {canSubmit && (
                                <Button
                                    size="sm"
                                    onClick={() =>
                                        navigate('/clinica/exercicios/enviar')
                                    }
                                    className="ml-auto cursor-pointer gap-2 sm:ml-0"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="sm:hidden">Enviar</span>
                                    <span className="hidden sm:inline">
                                        Enviar exercício
                                    </span>
                                </Button>
                            )}
                        </div>

                        {/* Active Filters */}
                        {activeFiltersCount > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {Object.entries(filters)
                                    .filter(([key]) => key !== 'search')
                                    .map(([categoryId, values]) =>
                                        (values as string[]).map((value) => (
                                            <Badge
                                                key={`${categoryId}-${value}`}
                                                variant="secondary"
                                                className="gap-1 pr-1"
                                            >
                                                {getFilterLabel(
                                                    categoryId,
                                                    value,
                                                )}
                                                <button
                                                    onClick={() =>
                                                        removeFilter(
                                                            categoryId,
                                                            value,
                                                        )
                                                    }
                                                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-muted-foreground/20"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        )),
                                    )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setFilters(initialFilters)}
                                    className="h-7 text-xs text-muted-foreground"
                                >
                                    Limpar todos
                                </Button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Exercise Grid */}
                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-auto p-4 sm:p-6"
                >
                    <div className="mb-4">
                        {isLoading ? (
                            <Skeleton className="h-4 w-40" />
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {filteredExercises.length} exercício
                                {filteredExercises.length !== 1 ? 's' : ''}{' '}
                                encontrado
                                {filteredExercises.length !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                            {Array.from({ length: 20 }).map((_, i) => (
                                <ExerciseCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : filteredExercises.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                                {filteredExercises.map((exercise) => (
                                    <ExerciseCard
                                        key={exercise.id}
                                        videoUrl={exercise.videoUrl}
                                        thumbnailUrl={exercise.thumbnailUrl}
                                        title={exercise.title}
                                        subtitle={exercise.specialty}
                                        isFavorite={exercise.isFavorite}
                                        onToggleFavorite={() =>
                                            handleToggleFavorite(exercise)
                                        }
                                        onInfo={() => handleInfo(exercise)}
                                    />
                                ))}
                                {isFetchingNextPage &&
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <ExerciseCardSkeleton
                                            key={`skeleton-next-${i}`}
                                        />
                                    ))}
                            </div>
                            {/* Sentinel for infinite scroll */}
                            <div ref={sentinelRef} className="h-4" />
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Search className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="mb-2 text-lg font-medium text-foreground">
                                Nenhum exercício encontrado
                            </h3>
                            <p className="max-w-md text-muted-foreground">
                                Tente ajustar seus filtros ou buscar por outro
                                termo.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setFilters(initialFilters)}
                            >
                                Limpar filtros
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters as Sheet/Modal */}
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetContent side="right" className="w-80 p-0 sm:max-w-sm">
                    <ExerciseFilters
                        categories={filterCategories}
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                </SheetContent>
            </Sheet>

            {/* Video Player Modal */}
            <VideoPlayerModal
                exercise={selectedExercise}
                open={isVideoModalOpen}
                onOpenChange={setIsVideoModalOpen}
                onToggleFavorite={handleToggleFavorite}
            />
        </>
    );

    if (embedded) return content;

    return <ClinicLayout>{content}</ClinicLayout>;
}
