import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
    applyLibraryFilters,
    facetLabel,
    facetOptions,
    FACETS,
    INITIAL_LIBRARY_FILTERS,
    libraryApiParams,
    setFacet,
    type FacetKey,
    type LibraryFilters,
} from '@/application/clinic/exercise-library-filters';
import {
    useInfiniteExercises,
    useToggleExerciseFavorite,
} from '@/application/clinic/use-exercises';
import { DsDropdown } from '@/components/ds';
import type { Exercise } from '@/domain/clinic';
import { useDebounce } from '@/lib/use-debounce';

export {
    activeLibraryFilterCount as activeFilterCount,
    applyLibraryFilters as applyFilters,
    DIFFICULTY,
    facetLabel,
    facetOptions,
    FACETS,
    INITIAL_LIBRARY_FILTERS as INITIAL_FILTERS,
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

/**
 * A biblioteca paginada pela API: busca e dificuldade vão para o servidor,
 * os outros filtros recortam o que já veio, e o `sentinel` no fim da grade
 * pede a próxima página ao aparecer. É a mesma da aba Exercícios e a da
 * seleção do assistente de programa.
 */
export function usePagedExerciseLibrary() {
    const [filters, setFilters] = useState<LibraryFilters>(
        INITIAL_LIBRARY_FILTERS,
    );
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});
    const sentinelRef = useRef<HTMLDivElement>(null);
    const update = (patch: Partial<LibraryFilters>) =>
        setFilters((prev) => ({ ...prev, ...patch }));
    const clearFilters = () => setFilters(INITIAL_LIBRARY_FILTERS);

    const search = useDebounce(filters.search, 300);
    const apiParams = libraryApiParams({ ...filters, search });
    const {
        data,
        isLoading,
        isError,
        isPlaceholderData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteExercises({ ...apiParams, perPage: 20 });
    const toggleFavorite = useToggleExerciseFavorite();

    const loaded = useMemo(
        () =>
            (data?.pages.flatMap((p) => p.items) ?? []).map((exercise) =>
                exercise.id in overrides
                    ? { ...exercise, isFavorite: overrides[exercise.id] }
                    : exercise,
            ),
        [data, overrides],
    );
    const filtered = useMemo(
        () =>
            applyLibraryFilters(loaded, filters, {
                skipSearch: Boolean(apiParams.search) && !isPlaceholderData,
            }),
        [loaded, filters, apiParams.search, isPlaceholderData],
    );

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0]?.isIntersecting &&
                    hasNextPage &&
                    !isFetchingNextPage
                ) {
                    void fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, filtered.length]);

    const onToggleFavorite = (exercise: Exercise) => {
        const next = !exercise.isFavorite;
        setOverrides((prev) => ({ ...prev, [exercise.id]: next }));
        toggleFavorite.mutate(exercise.id, {
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

    const searchingMore = filtered.length === 0 && Boolean(hasNextPage);
    const sentinel = (
        <>
            {searchingMore && (
                <p
                    role="status"
                    className="text-ds-body-sm text-ds-content-muted"
                >
                    Procurando nos próximos exercícios…
                </p>
            )}
            <div ref={sentinelRef} className="h-4" aria-hidden="true" />
        </>
    );

    return {
        filters,
        update,
        clearFilters,
        loaded,
        filtered,
        isLoading,
        isError,
        searchingMore,
        onToggleFavorite,
        sentinel,
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
