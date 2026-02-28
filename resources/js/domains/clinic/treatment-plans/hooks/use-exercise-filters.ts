import { router } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';


import { useToggleFavorite } from '@/domains/clinic/exercises';
import * as treatmentPlansRoute from '@/routes/clinic/treatment-plans';
import type { PaginatedResponse } from '@/types/pagination';
import type { BodyRegion, Exercise, PhysioArea } from '@/types';
import type { ExerciseFilters as Filters, FilterCategory } from '@/types/exercise';

import type { ServerExerciseFilters, TreatmentPlanTab } from '../types';
import { EMPTY_EXERCISE_FILTERS, toArray } from '../utils';

interface UseExerciseFiltersProps {
    exercises: PaginatedResponse<Exercise>;
    serverExerciseFilters: ServerExerciseFilters;
    physioAreas: PhysioArea[];
    bodyRegions: BodyRegion[];
    difficulties: Record<string, string>;
    movementForms: Record<string, string>;
    tab: TreatmentPlanTab;
}

export interface UseExerciseFiltersReturn {
    localExercises: Exercise[];
    setLocalExercises: React.Dispatch<React.SetStateAction<Exercise[]>>;
    descriptionModalExercise: Exercise | null;
    setDescriptionModalExercise: React.Dispatch<React.SetStateAction<Exercise | null>>;
    showFilters: boolean;
    setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
    exerciseSearchInput: string;
    setExerciseSearchInput: React.Dispatch<React.SetStateAction<string>>;
    localExerciseFilters: Filters;
    filterCategories: FilterCategory[];
    activeFiltersCount: number;
    handleExerciseFiltersChange: (filters: Filters) => void;
    removeExerciseFilter: (categoryId: string, value: string) => void;
    clearAllExerciseFilters: () => void;
    getFilterLabel: (categoryId: string, value: string) => string;
    handleToggleFavorite: (exercise: Exercise) => Promise<void>;
}

export function useExerciseFilters({
    exercises,
    serverExerciseFilters,
    physioAreas,
    bodyRegions,
    difficulties,
    movementForms,
    tab,
}: UseExerciseFiltersProps): UseExerciseFiltersReturn {
    const [showFilters, setShowFilters] = useState(true);
    const [localExercises, setLocalExercises] = useState<Exercise[]>(exercises.data);
    const [descriptionModalExercise, setDescriptionModalExercise] = useState<Exercise | null>(null);
    const [exerciseSearchInput, setExerciseSearchInput] = useState(serverExerciseFilters.search ?? '');
    const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    useEffect(() => {
        const id = setTimeout(() => setLocalExercises(exercises.data), 0);
        return () => clearTimeout(id);
    }, [exercises.data]);

    const localExerciseFilters: Filters = useMemo(
        () => ({
            search: serverExerciseFilters.search ?? '',
            physio_area_id: toArray(serverExerciseFilters.physio_area_id),
            body_region_id: toArray(serverExerciseFilters.body_region_id),
            difficulty_level: toArray(serverExerciseFilters.difficulty_level),
            movement_form: toArray(serverExerciseFilters.movement_form),
        }),
        [serverExerciseFilters],
    );

    const filterCategories: FilterCategory[] = useMemo(
        () => [
            {
                id: 'physio_area_id',
                label: 'Área de Fisioterapia',
                options: physioAreas.map((a) => ({ value: String(a.id), label: a.name })),
            },
            {
                id: 'body_region_id',
                label: 'Região do Corpo',
                options: bodyRegions.map((r) => ({ value: String(r.id), label: r.name })),
            },
            {
                id: 'difficulty_level',
                label: 'Dificuldade',
                options: Object.entries(difficulties).map(([value, label]) => ({ value, label })),
            },
            {
                id: 'movement_form',
                label: 'Forma de Movimento',
                options: Object.entries(movementForms).map(([value, label]) => ({ value, label })),
            },
        ],
        [physioAreas, bodyRegions, difficulties, movementForms],
    );

    const activeFiltersCount = useMemo(
        () =>
            Object.entries(localExerciseFilters)
                .filter(([key]) => key !== 'search')
                .reduce((count, [, value]) => count + (Array.isArray(value) ? value.length : 0), 0),
        [localExerciseFilters],
    );

    const applyExerciseFilters = useCallback((newFilters: Filters) => {
        const params: Record<string, string | string[]> = { tab: 'exercicios' };
        if (newFilters.search) params.search = newFilters.search;
        if (newFilters.physio_area_id.length) params.physio_area_id = newFilters.physio_area_id;
        if (newFilters.body_region_id.length) params.body_region_id = newFilters.body_region_id;
        if (newFilters.difficulty_level.length) params.difficulty_level = newFilters.difficulty_level;
        if (newFilters.movement_form.length) params.movement_form = newFilters.movement_form;

        router.get(treatmentPlansRoute.index().url, params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    useEffect(() => {
        if (tab !== 'exercicios') return;
        if (exerciseSearchInput === (serverExerciseFilters.search ?? '')) return;

        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            applyExerciseFilters({ ...localExerciseFilters, search: exerciseSearchInput });
        }, 300);

        return () => clearTimeout(searchTimerRef.current);
    }, [exerciseSearchInput, serverExerciseFilters.search, localExerciseFilters, applyExerciseFilters, tab]);

    const handleExerciseFiltersChange = (newFilters: Filters) => {
        setExerciseSearchInput(newFilters.search);
        applyExerciseFilters(newFilters);
    };

    const removeExerciseFilter = (categoryId: string, value: string) => {
        const updated = {
            ...localExerciseFilters,
            [categoryId]: (localExerciseFilters[categoryId as keyof Filters] as string[]).filter((v) => v !== value),
        };
        applyExerciseFilters(updated);
    };

    const clearAllExerciseFilters = () => {
        setExerciseSearchInput('');
        applyExerciseFilters(EMPTY_EXERCISE_FILTERS);
    };

    const getFilterLabel = (categoryId: string, value: string) => {
        const category = filterCategories.find((c) => c.id === categoryId);
        return category?.options.find((o) => o.value === value)?.label ?? value;
    };

    const handleToggleFavorite = useToggleFavorite(setLocalExercises);

    return {
        localExercises,
        setLocalExercises,
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
    };
}
