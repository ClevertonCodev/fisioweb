import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Search,
    SlidersHorizontal,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExerciseCard, ExerciseDescriptionModal, ExerciseFilters } from '@/domains/clinic/exercises';
import ClinicLayout from '@/layouts/clinic-layout';
import { dashboard } from '@/routes/clinic';
import type { PaginatedResponse } from '@/types/pagination';
import type {
    BodyRegion,
    Exercise,
    PhysioArea,
} from '@/types';
import type {
    ExerciseFilters as Filters,
    FilterCategory,
} from '@/types/exercise';

interface ServerFilters {
    search?: string;
    physio_area_id?: string | string[];
    body_region_id?: string | string[];
    difficulty_level?: string | string[];
    movement_form?: string | string[];
}

interface ExercisesPageProps {
    exercises: PaginatedResponse<Exercise>;
    filters: ServerFilters;
    physioAreas: PhysioArea[];
    bodyRegions: BodyRegion[];
    difficulties: Record<string, string>;
    movementForms: Record<string, string>;
}

function toArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

const emptyFilters: Filters = {
    search: '',
    physio_area_id: [],
    body_region_id: [],
    difficulty_level: [],
    movement_form: [],
};

export default function ExerciciosPage({
    exercises,
    filters: serverFilters,
    physioAreas,
    bodyRegions,
    difficulties,
    movementForms,
}: ExercisesPageProps) {
    const [showFilters, setShowFilters] = useState(true);
    const [descriptionModalExercise, setDescriptionModalExercise] = useState<Exercise | null>(null);
    const [searchInput, setSearchInput] = useState(
        serverFilters.search ?? '',
    );
    const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const localFilters: Filters = useMemo(
        () => ({
            search: serverFilters.search ?? '',
            physio_area_id: toArray(serverFilters.physio_area_id),
            body_region_id: toArray(serverFilters.body_region_id),
            difficulty_level: toArray(serverFilters.difficulty_level),
            movement_form: toArray(serverFilters.movement_form),
        }),
        [serverFilters],
    );

    const filterCategories: FilterCategory[] = useMemo(
        () => [
            {
                id: 'physio_area_id',
                label: 'Área de Fisioterapia',
                options: physioAreas.map((a) => ({
                    value: String(a.id),
                    label: a.name,
                })),
            },
            {
                id: 'body_region_id',
                label: 'Região do Corpo',
                options: bodyRegions.map((r) => ({
                    value: String(r.id),
                    label: r.name,
                })),
            },
            {
                id: 'difficulty_level',
                label: 'Dificuldade',
                options: Object.entries(difficulties).map(
                    ([value, label]) => ({ value, label }),
                ),
            },
            {
                id: 'movement_form',
                label: 'Forma de Movimento',
                options: Object.entries(movementForms).map(
                    ([value, label]) => ({ value, label }),
                ),
            },
        ],
        [physioAreas, bodyRegions, difficulties, movementForms],
    );

    const activeFiltersCount = useMemo(
        () =>
            Object.entries(localFilters)
                .filter(([key]) => key !== 'search')
                .reduce(
                    (count, [, value]) =>
                        count +
                        (Array.isArray(value) ? value.length : 0),
                    0,
                ),
        [localFilters],
    );

    const applyFilters = useCallback(
        (newFilters: Filters) => {
            const params: Record<string, string | string[]> = {};
            if (newFilters.search) params.search = newFilters.search;
            if (newFilters.physio_area_id.length)
                params.physio_area_id = newFilters.physio_area_id;
            if (newFilters.body_region_id.length)
                params.body_region_id = newFilters.body_region_id;
            if (newFilters.difficulty_level.length)
                params.difficulty_level = newFilters.difficulty_level;
            if (newFilters.movement_form.length)
                params.movement_form = newFilters.movement_form;

            router.get('/clinic/exercises', params, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [],
    );

    useEffect(() => {
        if (searchInput === (serverFilters.search ?? '')) return;

        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            applyFilters({ ...localFilters, search: searchInput });
        }, 300);

        return () => clearTimeout(searchTimerRef.current);
    }, [searchInput, serverFilters.search, localFilters, applyFilters]);

    const handleFiltersChange = (newFilters: Filters) => {
        setSearchInput(newFilters.search);
        applyFilters(newFilters);
    };


    const removeFilter = (categoryId: string, value: string) => {
        const updated = {
            ...localFilters,
            [categoryId]: (
                localFilters[categoryId as keyof Filters] as string[]
            ).filter((v) => v !== value),
        };
        applyFilters(updated);
    };

    const clearAllFilters = () => {
        setSearchInput('');
        applyFilters(emptyFilters);
    };

    const getFilterLabel = (categoryId: string, value: string) => {
        const category = filterCategories.find((c) => c.id === categoryId);
        const option = category?.options.find((o) => o.value === value);
        return option?.label ?? value;
    };

    const dashboardRoute = (dashboard() as { url?: string })?.url ?? '/clinic/dashboard';

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
                                        value={searchInput}
                                        onChange={(e) =>
                                            setSearchInput(e.target.value)
                                        }
                                        className="pl-9"
                                    />
                                </div>
                                <Button
                                    variant={
                                        showFilters ? 'secondary' : 'outline'
                                    }
                                    size="sm"
                                    onClick={() =>
                                        setShowFilters(!showFilters)
                                    }
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
                                {Object.entries(localFilters)
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
                                    onClick={clearAllFilters}
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
                                {exercises.total} exercício
                                {exercises.total !== 1 ? 's' : ''}{' '}
                                encontrado
                                {exercises.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                        {exercises.data.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                    {exercises.data.map((exercise) => (
                                        <ExerciseCard
                                            key={exercise.id}
                                            exercise={exercise}
                                            onInfo={(ex) => setDescriptionModalExercise(ex)}
                                        />
                                    ))}
                                </div>
                                {exercises.last_page > 1 && (
                                    <div className="mt-8 flex items-center justify-center gap-2">
                                        {exercises.links.map((link, index) => {
                                            if (index === 0) {
                                                return (
                                                    <Button
                                                        key="prev"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9"
                                                        disabled={!link.url}
                                                        asChild={!!link.url}
                                                    >
                                                        {link.url ? (
                                                            <Link
                                                                href={link.url}
                                                                preserveState
                                                                preserveScroll
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </Link>
                                                        ) : (
                                                            <ChevronLeft className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                );
                                            }
                                            if (
                                                index ===
                                                exercises.links.length - 1
                                            ) {
                                                return (
                                                    <Button
                                                        key="next"
                                                        variant="outline"
                                                        size="icon"
                                                        className="h-9 w-9"
                                                        disabled={!link.url}
                                                        asChild={!!link.url}
                                                    >
                                                        {link.url ? (
                                                            <Link
                                                                href={link.url}
                                                                preserveState
                                                                preserveScroll
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </Link>
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                );
                                            }
                                            return (
                                                <Button
                                                    key={link.label}
                                                    variant={
                                                        link.active
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="icon"
                                                    className="h-9 w-9"
                                                    disabled={!link.url}
                                                    asChild={!!link.url}
                                                >
                                                    {link.url ? (
                                                        <Link
                                                            href={link.url}
                                                            preserveState
                                                            preserveScroll
                                                            dangerouslySetInnerHTML={{
                                                                __html:
                                                                    link.label,
                                                            }}
                                                        />
                                                    ) : (
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html:
                                                                    link.label,
                                                            }}
                                                        />
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
                                    onClick={clearAllFilters}
                                >
                                    Limpar filtros
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filtros em overlay (modal) – não empurra o conteúdo */}
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
                            filters={localFilters}
                            onFiltersChange={handleFiltersChange}
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
        </ClinicLayout>
    );
}
