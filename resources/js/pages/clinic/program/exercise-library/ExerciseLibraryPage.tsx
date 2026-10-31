import {
    Gauge,
    PersonStanding,
    Search,
    SlidersHorizontal,
    Star,
    Stethoscope,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    activeLibraryFilterCount,
    libraryChips,
    removeLibraryChip,
} from '@/application/clinic/exercise-library-filters';
import { can } from '@/application/clinic/permissions';
import {
    DsButton,
    DsDrawer,
    DsEmptyState,
    DsFilterChips,
    DsInput,
} from '@/components/ds';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import { useIsMobile } from '@/pages/clinic/use-media-query';

import { ProgramsPageShell } from '../programs-shell/ProgramsPageShell';

import { FavoritesDropdown, LibraryFiltersPanel } from './parts';
import { FacetDropdown, usePagedExerciseLibrary } from './shared';
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
    const [drawerOpen, setDrawerOpen] = useState(false);
    const {
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
    } = usePagedExerciseLibrary();

    const filterCount = activeLibraryFilterCount(filters);
    const isFiltered = filters.search !== '' || filterCount > 0;
    const chips = libraryChips(filters);
    const facetProps = { exercises: loaded, filters, onChange: update };

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
                hideCreateProgram={hideTabs}
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
                    sentinel={sentinel}
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
