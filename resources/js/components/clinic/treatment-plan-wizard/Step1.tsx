import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, ClipboardList, Dumbbell, Filter, Search, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ExerciseDescriptionModal } from '@/components/clinic/exercise-description-modal';
import { ExerciseCard } from '@/components/clinic/ExerciseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { Exercise, PhysioArea } from '@/types';

import { ExerciseThumb } from './ExerciseThumb';
import type { ExerciseConfig } from './types';

interface Step1Props {
    title?: string;
    backUrl: string;
    physioAreas: PhysioArea[];
    selected: ExerciseConfig[];
    onSelect: (exercise: Exercise) => void;
    onRemove: (exerciseId: number) => void;
    onAdvance: () => void;
}

export function Step1({ title = 'Novo programa', backUrl, physioAreas, selected, onSelect, onRemove, onAdvance }: Step1Props) {
    const [search, setSearch] = useState('');
    const [areaId, setAreaId] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [favoritesOnly, setFavoritesOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [panelOpen, setPanelOpen] = useState(selected.length > 0);
    const [descriptionExercise, setDescriptionExercise] = useState<Exercise | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchExercises = useCallback((q: string, area: string, p: number, favOnly: boolean) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (q) params.set('search', q);
        if (area) params.set('physio_area_id', area);
        if (favOnly) params.set('favorites_only', '1');
        params.set('per_page', '24');
        params.set('page', String(p));

        fetch(`/clinic/exercises/search?${params}`, {
            headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        })
            .then((r) => r.json())
            .then((res) => {
                const data = res.data?.data ?? res.data ?? [];
                setExercises(Array.isArray(data) ? data : []);
                setLastPage(res.data?.last_page ?? 1);
            })
            .catch(() => setExercises([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        const id = setTimeout(() => fetchExercises('', '', 1, false), 0);
        return () => clearTimeout(id);
    }, [fetchExercises]);

    const handleSearchChange = (val: string) => {
        setSearch(val);
        setPage(1);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchExercises(val, areaId, 1, favoritesOnly), 400);
    };

    const handleAreaChange = (val: string) => {
        const next = areaId === val ? '' : val;
        setAreaId(next);
        setPage(1);
        fetchExercises(search, next, 1, favoritesOnly);
    };

    const handlePageChange = (p: number) => {
        setPage(p);
        fetchExercises(search, areaId, p, favoritesOnly);
    };

    const handleToggleFavoritesFilter = () => {
        const next = !favoritesOnly;
        setFavoritesOnly(next);
        setPage(1);
        fetchExercises(search, areaId, 1, next);
    };

    const handleToggleFavorite = async (exercise: Exercise) => {
        try {
            const rawCookie = document.cookie
                .split('; ')
                .find((row) => row.startsWith('XSRF-TOKEN='))
                ?.split('=')
                .slice(1)
                .join('=');
            const csrfToken = rawCookie ? decodeURIComponent(rawCookie) : undefined;
            const res = await fetch(`/clinic/exercises/${exercise.id}/toggle-favorite`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
                },
            });
            const data = await res.json();
            setExercises((prev) => prev.map((ex) => (ex.id === exercise.id ? { ...ex, is_favorite: data.is_favorite } : ex)));
        } catch {
            // silently fail
        }
    };

    const isSelected = (id: number) => selected.some((s) => s.exercise_id === id);
    const hasSelected = selected.length > 0;

    const handleExerciseSelect = (exercise: Exercise) => {
        if (isSelected(exercise.id)) {
            onRemove(exercise.id);
        } else {
            onSelect(exercise);
            if (!panelOpen) setPanelOpen(true);
        }
    };

    return (
        <div className="flex h-full">
            {/* Left: exercise grid */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-border p-4">
                    <button
                        type="button"
                        onClick={() => router.visit(backUrl)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Voltar
                    </button>
                    <h1 className="text-lg font-semibold">{title}</h1>
                </div>

                {/* Search + filter bar */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar"
                            value={search}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        variant={favoritesOnly ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={handleToggleFavoritesFilter}
                    >
                        <Star className={cn('h-4 w-4', favoritesOnly && 'fill-current')} />
                        Favoritos
                    </Button>
                    <Button
                        variant={showFilters ? 'default' : 'outline'}
                        size="sm"
                        className="gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                    </Button>
                </div>

                {/* Area filter chips */}
                {showFilters && (
                    <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
                        {physioAreas.map((area) => (
                            <button
                                key={area.id}
                                type="button"
                                onClick={() => handleAreaChange(String(area.id))}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                                    areaId === String(area.id)
                                        ? 'border-teal-600 bg-teal-600 text-white'
                                        : 'border-border bg-background text-foreground hover:border-teal-600',
                                )}
                            >
                                {area.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Spinner />
                        </div>
                    ) : exercises.length === 0 ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Dumbbell className="h-10 w-10 opacity-30" />
                            <p>Nenhum exercício encontrado</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                {exercises.map((ex) => (
                                    <ExerciseCard
                                        key={ex.id}
                                        exercise={ex}
                                        selected={isSelected(ex.id)}
                                        onSelect={handleExerciseSelect}
                                        onToggleFavorite={handleToggleFavorite}
                                        isFavorite={!!ex.is_favorite}
                                        onInfo={(exercise) => setDescriptionExercise(exercise)}
                                    />
                                ))}
                            </div>
                            {lastPage > 1 && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === 1}
                                        onClick={() => handlePageChange(page - 1)}
                                    >
                                        Anterior
                                    </Button>
                                    <span className="text-sm text-muted-foreground">
                                        {page} / {lastPage}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={page === lastPage}
                                        onClick={() => handlePageChange(page + 1)}
                                    >
                                        Próximo
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Right: selected panel */}
            {hasSelected && (
                <>
                    {panelOpen ? (
                        <div className="flex w-72 flex-shrink-0 flex-col border-l border-border">
                            <div className="flex items-center justify-between border-b border-border p-4">
                                <div className="flex min-w-0 flex-1 items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPanelOpen(false)}
                                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-teal-600 transition-colors hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950"
                                        title="Fechar painel"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <span className="min-w-0 truncate font-semibold">
                                        {selected.length} {selected.length === 1 ? 'exercício selecionado' : 'exercícios selecionados'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 space-y-2 overflow-y-auto p-3">
                                {selected.map((cfg) => (
                                    <div key={cfg.exercise_id} className="flex items-center gap-2">
                                        <ExerciseThumb exercise={cfg.exercise} size="sm" />
                                        <p className="line-clamp-2 min-w-0 flex-1 text-xs font-medium">{cfg.exercise.name}</p>
                                        <button
                                            type="button"
                                            onClick={() => onRemove(cfg.exercise_id)}
                                            className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-border p-4">
                                <Button
                                    className="w-full bg-teal-600 text-white hover:bg-teal-700"
                                    disabled={selected.length === 0}
                                    onClick={onAdvance}
                                >
                                    Avançar
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-shrink-0 items-center pl-4">
                            <button
                                type="button"
                                onClick={() => setPanelOpen(true)}
                                className="flex items-center gap-3 rounded-xl border-0 bg-teal-600 px-4 py-3 text-left text-white shadow-md transition-colors hover:bg-teal-700"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                                    <ClipboardList className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Programa com</p>
                                    <p className="text-base font-bold">
                                        {selected.length} exercício{selected.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </button>
                        </div>
                    )}
                </>
            )}

            <ExerciseDescriptionModal
                exercise={descriptionExercise}
                open={!!descriptionExercise}
                onOpenChange={(open) => !open && setDescriptionExercise(null)}
            />
        </div>
    );
}
