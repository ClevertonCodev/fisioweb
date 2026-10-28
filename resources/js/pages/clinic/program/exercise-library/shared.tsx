import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';

import {
    FACETS,
    facetLabel,
    facetOptions,
    setFacet,
    type FacetKey,
    type LibraryFilters,
} from '@/application/clinic/exercise-library-filters';
import {
    listExercisesPaginated,
    useToggleExerciseFavorite,
} from '@/application/clinic/use-exercises';
import { DsDropdown } from '@/components/ds';
import type { Exercise } from '@/domain/clinic';

export {
    DIFFICULTY,
    FACETS,
    INITIAL_LIBRARY_FILTERS as INITIAL_FILTERS,
    activeLibraryFilterCount as activeFilterCount,
    applyLibraryFilters as applyFilters,
    facetLabel,
    facetOptions,
    libraryApiParams,
    libraryChips,
    removeLibraryChip as removeChip,
    setFacet,
    subtitleOf,
    type FacetKey,
    type LibraryFilters,
} from '@/application/clinic/exercise-library-filters';

function multiLabel(name: string, selected: string[]): string {
    if (selected.length === 0) return name;
    if (selected.length === 1) return selected[0] as string;
    return `${name} (${selected.length})`;
}

export interface FiltersProps {
    exercises: Exercise[];
    filters: LibraryFilters;
    onChange: (patch: Partial<LibraryFilters>) => void;
}

export function useExerciseLibrary() {
    const query = useQuery({
        queryKey: ['exercises', 'library-all'],
        queryFn: () => listExercisesPaginated({ page: 1, perPage: 200 }),
    });
    const toggle = useToggleExerciseFavorite();
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});

    const exercises = useMemo(
        () =>
            (query.data?.items ?? [])
                .map((e) =>
                    e.id in overrides
                        ? { ...e, isFavorite: overrides[e.id] as boolean }
                        : e,
                )
                .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')),
        [query.data, overrides],
    );

    const toggleFavorite = (exercise: Exercise) => {
        const next = !exercise.isFavorite;
        setOverrides((prev) => ({ ...prev, [exercise.id]: next }));
        toggle.mutate(exercise.id, {
            onSuccess: ({ isFavorite }) =>
                setOverrides((prev) => ({
                    ...prev,
                    [exercise.id]: isFavorite,
                })),
            onError: () =>
                setOverrides((prev) => {
                    const copy = { ...prev };
                    delete copy[exercise.id];
                    return copy;
                }),
        });
    };

    return {
        exercises,
        isLoading: query.isLoading,
        isError: query.isError,
        toggleFavorite,
    };
}

export function FacetDropdown({
    exercises,
    filters,
    onChange,
    facet,
    icon,
    menuAlign,
}: FiltersProps & {
    facet: FacetKey;
    icon: ReactNode;
    menuAlign?: 'left' | 'right';
}) {
    const def = FACETS.find((x) => x.key === facet)!;
    const options = facetOptions(exercises, filters, facet);
    if (options.length === 0) return null;
    return (
        <DsDropdown
            mode="checkbox"
            label={def.label}
            icon={icon}
            menuWidth={240}
            menuAlign={menuAlign}
            fixedLabel={multiLabel(
                def.label,
                filters.facets[facet].map((v) => facetLabel(facet, v)),
            )}
            items={options.map((o) => ({ key: o.value, label: o.label }))}
            value={filters.facets[facet]}
            onValueChange={(v) =>
                onChange(setFacet(filters, facet, v as string[]))
            }
        />
    );
}
