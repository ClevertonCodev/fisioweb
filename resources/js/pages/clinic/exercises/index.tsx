import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ExerciseCard } from '@/components/clinic/ExerciseCard';
import { ExerciseFilters } from '@/components/clinic/ExerciseFilters';
import { VideoPlayerModal } from '@/components/clinic/video-player-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockExercises, filterCategories } from '@/data/mockExercises';
import ClinicLayout from '@/layouts/clinic-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes/clinic';
import type { Exercise, ExerciseFilters as Filters } from '@/types/exercise';

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

export default function ExerciciosPage() {
    const [showFilters, setShowFilters] = useState(true);
    const [filters, setFilters] = useState<Filters>(initialFilters);
    const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
        null,
    );
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    const filteredExercises = useMemo(() => {
        return exercises.filter((exercise) => {
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
    }, [exercises, filters]);

    const activeFiltersCount = useMemo(
        () =>
            Object.entries(filters)
                .filter(([key]) => key !== 'search')
                .reduce(
                    (count, [, value]) =>
                        count +
                        (Array.isArray(value) ? value.length : 0),
                    0,
                ),
        [filters],
    );

    const handleToggleFavorite = (exercise: Exercise) => {
        setExercises((prev) =>
            prev.map((ex) =>
                ex.id === exercise.id
                    ? { ...ex, isFavorite: !ex.isFavorite }
                    : ex,
            ),
        );
    };

    const handlePlay = (exercise: Exercise) => {
        setSelectedExercise(exercise);
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
        return option?.label ?? value;
    };

    const dashboardRoute =
        (dashboard() as { url?: string })?.url ?? '/clinic/dashboard';

    return (
        <ClinicLayout>
            <Head title="Biblioteca de Exercícios" />
            <div className="flex h-full">
                <div className="flex min-w-0 flex-1 flex-col">
                    <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-6 py-4 supports-[backdrop-filter]:bg-background/80">
                        <div className="mb-4 flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="gap-1 text-muted-foreground hover:text-foreground"
                            >
                                <Link href={dashboardRoute}>
                                    <ArrowLeft className="h-4 w-4" />
                                    Voltar
                                </Link>
                            </Button>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <h1 className="text-2xl font-semibold text-foreground">
                                Biblioteca de Exercícios
                            </h1>
                            <div className="flex items-center gap-3">
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                <Button
                                    variant={showFilters ? 'secondary' : 'outline'}
                                    size="sm"
                                    onClick={() => setShowFilters(!showFilters)}
                                    className="gap-2"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filtros
                                    {activeFiltersCount > 0 && (
                                        <Badge
                                            variant="default"
                                            className="ml-1 h-5 px-1.5 text-xs"
                                        >
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Button>
                            </div>
                        </div>
                        {activeFiltersCount > 0 && (
                            <div className="mt-4 flex flex-wrap items-center gap-2">
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
                                                    type="button"
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
                    </header>
                    <div className="flex-1 overflow-auto p-6">
                        <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                                {filteredExercises.length} exercício
                                {filteredExercises.length !== 1 ? 's' : ''}{' '}
                                encontrado
                                {filteredExercises.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        {filteredExercises.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                {filteredExercises.map((exercise) => (
                                    <ExerciseCard
                                        key={exercise.id}
                                        exercise={exercise}
                                        onPlay={handlePlay}
                                        onToggleFavorite={handleToggleFavorite}
                                        onInfo={() => {}}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <Search className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-foreground">
                                    Nenhum exercício encontrado
                                </h3>
                                <p className="max-w-md text-muted-foreground">
                                    Tente ajustar seus filtros ou buscar por
                                    outro termo.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() =>
                                        setFilters(initialFilters)
                                    }
                                >
                                    Limpar filtros
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                <div
                    className={cn(
                        'flex h-full w-80 flex-shrink-0 flex-col overflow-hidden transition-all duration-300',
                        showFilters ? 'translate-x-0' : 'w-0 translate-x-full',
                    )}
                >
                    {showFilters && (
                        <ExerciseFilters
                            categories={filterCategories}
                            filters={filters}
                            onFiltersChange={setFilters}
                            onClose={() => setShowFilters(false)}
                        />
                    )}
                </div>
            </div>
            <VideoPlayerModal
                exercise={selectedExercise}
                open={isVideoModalOpen}
                onOpenChange={setIsVideoModalOpen}
            />
        </ClinicLayout>
    );
}
