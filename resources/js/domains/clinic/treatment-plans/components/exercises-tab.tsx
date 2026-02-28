import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExerciseCard, ExerciseDescriptionModal, ExerciseFilters } from '@/domains/clinic/exercises';
import type { PaginatedResponse } from '@/types/pagination';
import type { BodyRegion, Exercise, PhysioArea } from '@/types';

import { useExerciseFilters } from '../hooks/use-exercise-filters';
import type { ServerExerciseFilters, TreatmentPlanTab } from '../types';

interface ExercisesTabProps {
    exercises: PaginatedResponse<Exercise>;
    serverExerciseFilters: ServerExerciseFilters;
    physioAreas: PhysioArea[];
    bodyRegions: BodyRegion[];
    difficulties: Record<string, string>;
    movementForms: Record<string, string>;
    tab: TreatmentPlanTab;
}

export function ExercisesTab({
    exercises,
    serverExerciseFilters,
    physioAreas,
    bodyRegions,
    difficulties,
    movementForms,
    tab,
}: ExercisesTabProps) {
    const {
        localExercises,
        descriptionModalExercise,
        setDescriptionModalExercise,
        showFilters,
        setShowFilters,
        exerciseSearchInput,
        setExerciseSearchInput,
        localExerciseFilters,
        filterCategories,
        activeFiltersCount,
        handleExerciseFiltersChange,
        removeExerciseFilter,
        clearAllExerciseFilters,
        getFilterLabel,
        handleToggleFavorite,
    } = useExerciseFilters({
        exercises,
        serverExerciseFilters,
        physioAreas,
        bodyRegions,
        difficulties,
        movementForms,
        tab,
    });

    return (
        <>
            <div className="flex h-full min-h-0 flex-1">
                {/* Conteúdo principal */}
                <div className="flex min-w-0 flex-1 flex-col overflow-auto">
                    {/* Sub-header: busca + filtros */}
                    <div className="sticky top-[var(--header-h,0px)] z-20 border-b border-border bg-background/95 px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar"
                                    value={exerciseSearchInput}
                                    onChange={(e) => setExerciseSearchInput(e.target.value)}
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
                                    <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
                                        {activeFiltersCount}
                                    </Badge>
                                )}
                            </Button>
                        </div>

                        {/* Chips de filtros ativos */}
                        {activeFiltersCount > 0 && (
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                                {Object.entries(localExerciseFilters)
                                    .filter(([key]) => key !== 'search')
                                    .map(([categoryId, values]) =>
                                        (values as string[]).map((value) => (
                                            <Badge
                                                key={`${categoryId}-${value}`}
                                                variant="secondary"
                                                className="gap-1 pr-1"
                                            >
                                                {getFilterLabel(categoryId, value)}
                                                <button
                                                    type="button"
                                                    onClick={() => removeExerciseFilter(categoryId, value)}
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
                                    onClick={clearAllExerciseFilters}
                                    className="h-7 text-xs text-muted-foreground"
                                >
                                    Limpar todos
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Grade de exercícios */}
                    <div className="flex-1 p-6">
                        <div className="mb-4">
                            <p className="text-sm text-muted-foreground">
                                {exercises.total} exercício{exercises.total !== 1 ? 's' : ''} encontrado
                                {exercises.total !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {localExercises.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {localExercises.map((exercise) => (
                                        <ExerciseCard
                                            key={exercise.id}
                                            exercise={exercise}
                                            isFavorite={!!exercise.is_favorite}
                                            onToggleFavorite={handleToggleFavorite}
                                            onInfo={(ex) => setDescriptionModalExercise(ex)}
                                        />
                                    ))}
                                </div>

                                {/* Paginação */}
                                {exercises.last_page > 1 && (
                                    <div className="mt-8 flex items-center justify-center gap-2">
                                        {exercises.links.map((link, index) => {
                                            const isFirst = index === 0;
                                            const isLast = index === exercises.links.length - 1;
                                            return (
                                                <Button
                                                    key={isFirst ? 'prev' : isLast ? 'next' : link.label}
                                                    variant={link.active ? 'default' : 'outline'}
                                                    size="icon"
                                                    className="h-9 w-9"
                                                    disabled={!link.url}
                                                    asChild={!!link.url}
                                                >
                                                    {link.url ? (
                                                        isFirst ? (
                                                            <Link href={link.url} preserveState preserveScroll>
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Link>
                                                        ) : isLast ? (
                                                            <Link href={link.url} preserveState preserveScroll>
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Link>
                                                        ) : (
                                                            <Link
                                                                href={link.url}
                                                                preserveState
                                                                preserveScroll
                                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                            />
                                                        )
                                                    ) : isFirst ? (
                                                        <ChevronLeft className="h-4 w-4" />
                                                    ) : isLast ? (
                                                        <ChevronRight className="h-4 w-4" />
                                                    ) : (
                                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                    )}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <Search className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-2 text-lg font-medium text-foreground">Nenhum exercício encontrado</h3>
                                <p className="max-w-md text-muted-foreground">
                                    Tente ajustar seus filtros ou buscar por outro termo.
                                </p>
                                <Button variant="outline" className="mt-4" onClick={clearAllExerciseFilters}>
                                    Limpar filtros
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filtros em overlay */}
            {showFilters && (
                <>
                    <button
                        type="button"
                        aria-label="Fechar filtros"
                        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
                        onClick={() => setShowFilters(false)}
                    />
                    <div className="fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col overflow-hidden border-l border-border bg-card shadow-xl animate-in slide-in-from-right duration-300">
                        <ExerciseFilters
                            categories={filterCategories}
                            filters={localExerciseFilters}
                            onFiltersChange={handleExerciseFiltersChange}
                            onClose={() => setShowFilters(false)}
                        />
                    </div>
                </>
            )}

            <ExerciseDescriptionModal
                exercise={descriptionModalExercise}
                open={!!descriptionModalExercise}
                onOpenChange={(open) => !open && setDescriptionModalExercise(null)}
            />
        </>
    );
}
