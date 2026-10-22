import {
    Gauge,
    PersonStanding,
    Search,
    SlidersHorizontal,
    Star,
    Stethoscope,
    Upload,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    activeLibraryFilterCount,
    applyLibraryFilters,
    INITIAL_LIBRARY_FILTERS,
    libraryApiParams,
    libraryChips,
    removeLibraryChip,
    type LibraryFilters,
} from '@/application/clinic/exercise-library-filters';
import { can } from '@/application/clinic/permissions';
import {
    useInfiniteExercises,
    useToggleExerciseFavorite,
} from '@/application/clinic/use-exercises';
import {
    DsButton,
    DsDrawer,
    DsEmptyState,
    DsFilterChips,
    DsInput,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type { Exercise } from '@/domain/clinic';
import { useIsMobile } from '@/pages/clinic/use-media-query';

import { ProgramsPageShell } from '../programs-shell/ProgramsPageShell';

import { FavoritesDropdown, LibraryFiltersPanel } from './parts';
import { FacetDropdown } from './shared';
import { VariantD } from './VariantD';

const SUBMIT_PATH = '/clinica/exercicios/enviar';
const BAR_FACETS = ['specialty', 'bodyRegion', 'difficulty'] as const;

function countLabel(n: number, filtered: boolean): string {
    const noun = n === 1 ? 'exercício' : 'exercícios';
    if (filtered) {
        return `${n} ${noun} ${n === 1 ? 'encontrado' : 'encontrados'}`;
    }
    return `${n} ${noun} na biblioteca`;
}

export default function ExerciseLibraryPage({
    hideTabs = false,
}: {
    hideTabs?: boolean;
}) {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { user } = useAuth();
    const canSubmit = can.manageUsers(user?.role as ClinicRole | undefined);
    const [filters, setFilters] = useState<LibraryFilters>(
        INITIAL_LIBRARY_FILTERS,
    );
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});
    const sentinelRef = useRef<HTMLDivElement>(null);

    const update = (patch: Partial<LibraryFilters>) =>
        setFilters((prev) => ({ ...prev, ...patch }));
    const clearFilters = () => setFilters(INITIAL_LIBRARY_FILTERS);

    const apiParams = libraryApiParams(filters);
    const {
        data,
        isLoading,
        isError,
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
                skipSearch: Boolean(apiParams.search),
            }),
        [loaded, filters, apiParams.search],
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

    const filterCount = activeLibraryFilterCount(filters);
    const isFiltered = filters.search !== '' || filterCount > 0;
    const chips = libraryChips(filters);
    const facetProps = { exercises: loaded, filters, onChange: update };
    // Favoritos e facetas recortam só o que já veio: com página por vir, o
    // vazio ainda não é final e a rolagem precisa continuar buscando.
    const searchingMore = filtered.length === 0 && Boolean(hasNextPage);

    const emptyState = isError ? (
        <DsEmptyState
            variant="error"
            title="Erro ao carregar exercícios"
            description="Tente de novo em alguns instantes."
        />
    ) : searchingMore ? null : filtered.length === 0 && !isFiltered ? (
        <DsEmptyState
            variant="empty"
            title="Nenhum exercício na biblioteca"
            description="A biblioteca ainda não tem exercícios visíveis para esta clínica."
        />
    ) : filtered.length === 0 ? (
        <DsEmptyState
            variant="no-results"
            title="Nenhum exercício encontrado"
            action={
                isFiltered ? (
                    <DsButton
                        variant="secondary"
                        label="Limpar filtros"
                        onClick={clearFilters}
                    />
                ) : undefined
            }
        />
    ) : null;

    return (
        <>
            <ProgramsPageShell
                hideTabs={hideTabs}
                subtitle={
                    isLoading
                        ? 'Carregando exercícios…'
                        : countLabel(filtered.length, isFiltered)
                }
                extraActions={
                    canSubmit ? (
                        <DsButton
                            variant="secondary"
                            iconPosition={isMobile ? 'only' : 'left'}
                            icon={<Upload />}
                            label="Enviar exercício"
                            onClick={() => navigate(SUBMIT_PATH)}
                        />
                    ) : undefined
                }
                filters={
                    <div className="flex items-center gap-2 sm:gap-3 md:flex-wrap">
                        <div className="min-w-0 flex-1 md:basis-65">
                            <DsInput
                                type="search"
                                aria-label="Pesquisar exercícios"
                                placeholder={
                                    isMobile
                                        ? 'Pesquisar exercício'
                                        : 'Pesquisar por nome, região ou músculo'
                                }
                                iconLeft={<Search />}
                                value={filters.search}
                                onValueChange={(search) => update({ search })}
                                onCleared={() => update({ search: '' })}
                            />
                        </div>
                        <div className="hidden flex-wrap items-center gap-3 md:flex">
                            <FacetDropdown
                                {...facetProps}
                                facet="specialty"
                                icon={<Stethoscope />}
                            />
                            <FacetDropdown
                                {...facetProps}
                                facet="bodyRegion"
                                icon={<PersonStanding />}
                            />
                            <FacetDropdown
                                {...facetProps}
                                facet="difficulty"
                                icon={<Gauge />}
                            />
                            <FavoritesDropdown
                                filters={filters}
                                onChange={update}
                                icon={<Star />}
                            />
                        </div>
                        <div className="md:hidden">
                            <DsButton
                                variant={
                                    filterCount > 0 ? 'primary' : 'secondary'
                                }
                                iconPosition={isMobile ? 'only' : 'left'}
                                icon={<SlidersHorizontal />}
                                label={
                                    filterCount > 0
                                        ? `Filtros (${filterCount})`
                                        : 'Filtros'
                                }
                                onClick={() => setDrawerOpen(true)}
                            />
                        </div>
                    </div>
                }
                chips={
                    chips.length > 0 ? (
                        <DsFilterChips
                            chips={chips}
                            onRemove={(chip) =>
                                update(removeLibraryChip(filters, chip))
                            }
                            onClear={clearFilters}
                        />
                    ) : (
                        <span className="text-ds-body-compact text-ds-content-muted">
                            Nenhum filtro aplicado
                        </span>
                    )
                }
            >
                <VariantD
                    embedded
                    filtered={filtered}
                    all={loaded}
                    filters={filters}
                    onChange={update}
                    onClearFilters={clearFilters}
                    onToggleFavorite={onToggleFavorite}
                    isLoading={isLoading}
                    emptyState={emptyState}
                    sentinel={
                        <>
                            {searchingMore && (
                                <p
                                    role="status"
                                    className="text-ds-body-sm text-ds-content-muted"
                                >
                                    Procurando nos próximos exercícios…
                                </p>
                            )}
                            <div
                                ref={sentinelRef}
                                className="h-4"
                                aria-hidden="true"
                            />
                        </>
                    }
                />
            </ProgramsPageShell>
            <DsDrawer
                open={drawerOpen}
                onOpenChange={setDrawerOpen}
                placement="bottom"
                title="Filtros"
                footer={
                    <div className="flex w-full items-center gap-3">
                        <DsButton
                            variant="tertiary"
                            label="Limpar"
                            disabled={chips.length === 0}
                            onClick={clearFilters}
                        />
                        <div className="ml-auto">
                            <DsButton
                                label={`Ver ${filtered.length} ${filtered.length === 1 ? 'exercício' : 'exercícios'}`}
                                onClick={() => setDrawerOpen(false)}
                            />
                        </div>
                    </div>
                }
            >
                <LibraryFiltersPanel {...facetProps} facets={[...BAR_FACETS]} />
            </DsDrawer>
        </>
    );
}
