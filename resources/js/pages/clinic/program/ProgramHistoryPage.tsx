import { Plus, Rows3, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
    activeFilterCount,
    applyFilters,
    historyChips,
    INITIAL_FILTERS,
    paginate,
    parseDate,
    PER_PAGE_OPTIONS,
    removeChip,
    type HistoryFilters,
} from '@/application/clinic/program-history-filters';
import { useClinicProfessionals } from '@/application/clinic/use-clinic-users';
import { useClinicPrograms } from '@/application/clinic/use-programs';
import {
    DsButton,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsFilterChips,
    DsInput,
    DsPagination,
} from '@/components/ds';
import { useIsMobile } from '@/pages/clinic/use-media-query';

import {
    ProgramHistoryCardFooter,
    useProgramHistoryActions,
} from './program-history/ProgramHistoryActions';
import { ProgramHistoryCardGrid } from './program-history/ProgramHistoryCard';
import {
    HistoryFiltersBar,
    HistoryFiltersPanel,
} from './program-history/ProgramHistoryFilters';
import { ProgramsPageShell } from './programs-shell/ProgramsPageShell';

function totalLabel(total: number, filtered: boolean): string {
    const noun = total === 1 ? 'programa' : 'programas';
    if (filtered) {
        return `${total} ${noun} ${total === 1 ? 'encontrado' : 'encontrados'}`;
    }
    return `${total} ${noun} no histórico`;
}

function Skeletons() {
    return (
        <div
            aria-label="Carregando programas"
            className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4"
        >
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="h-64 animate-pulse rounded-ds-xl bg-ds-surface-subtle"
                />
            ))}
        </div>
    );
}

export default function ProgramHistoryPage() {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [searchParams, setSearchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');

    const [filters, setFilters] = useState<HistoryFilters>(INITIAL_FILTERS);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const update = (patch: Partial<HistoryFilters>) =>
        setFilters((prev) => ({
            ...prev,
            ...patch,
            page: patch.page ?? 1,
        }));

    const { data, isLoading, isError } = useClinicPrograms({
        page: 1,
        perPage: 200,
    });
    const { data: professionals = [] } = useClinicProfessionals();
    const { run, deleteModal } = useProgramHistoryActions();

    const sorted = useMemo(
        () =>
            [...(data?.items ?? [])].sort(
                (a, b) =>
                    (parseDate(b.createdAt)?.getTime() ?? 0) -
                    (parseDate(a.createdAt)?.getTime() ?? 0),
            ),
        [data],
    );
    const filtered = useMemo(
        () => applyFilters(sorted, filters, patientId),
        [sorted, filters, patientId],
    );
    const pageItems = paginate(filtered, filters.page, filters.perPage);

    const patientName = patientId
        ? (sorted.find((p) => p.patientId === patientId)?.patientName ??
          searchParams.get('search') ??
          'Paciente')
        : null;
    const filterCount = activeFilterCount(filters) + (patientId ? 1 : 0);
    const isFiltered = filters.search !== '' || filterCount > 0;
    const chips = historyChips(filters, professionals, patientName);

    const clearPatient = () =>
        setSearchParams(
            (prev) => {
                const next = new URLSearchParams(prev);
                next.delete('patientId');
                next.delete('search');
                return next;
            },
            { replace: true },
        );
    const clearFilters = () => {
        setFilters({
            ...INITIAL_FILTERS,
            perPage: filters.perPage,
        });
        clearPatient();
    };

    return (
        <>
            <ProgramsPageShell
                subtitle={
                    isLoading
                        ? 'Carregando programas…'
                        : totalLabel(filtered.length, isFiltered)
                }
                filters={
                    <div className="flex items-center gap-2 sm:gap-3 md:flex-wrap">
                        <div className="min-w-0 flex-1 md:basis-65">
                            <DsInput
                                type="search"
                                aria-label="Pesquisar programas"
                                placeholder={
                                    isMobile
                                        ? 'Pesquisar programa'
                                        : 'Pesquisar por paciente, programa ou profissional'
                                }
                                iconLeft={<Search />}
                                value={filters.search}
                                onValueChange={(search) => update({ search })}
                                onCleared={() => update({ search: '' })}
                            />
                        </div>
                        <div className="hidden flex-wrap items-center gap-3 md:flex">
                            <HistoryFiltersBar
                                filters={filters}
                                professionals={professionals}
                                onChange={update}
                            />
                            <DsDropdown
                                mode="radio"
                                label="Itens por página"
                                icon={<Rows3 />}
                                menuAlign="right"
                                menuTitle="Itens por página"
                                fixedLabel={`${filters.perPage} por página`}
                                items={PER_PAGE_OPTIONS.map((n) => ({
                                    key: String(n),
                                    label: `${n} por página`,
                                }))}
                                value={String(filters.perPage)}
                                onValueChange={(v) =>
                                    update({ perPage: Number(v) })
                                }
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
                                chip.key === 'patient'
                                    ? clearPatient()
                                    : update(removeChip(filters, chip))
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
                {isLoading ? (
                    <Skeletons />
                ) : isError ? (
                    <DsEmptyState
                        variant="error"
                        title="Erro ao carregar programas"
                        description="Tente de novo em alguns instantes."
                    />
                ) : filtered.length === 0 && !isFiltered ? (
                    <DsEmptyState
                        variant="empty"
                        title="Nenhum programa criado"
                        description="Monte o primeiro programa de exercícios para um paciente."
                        action={
                            <DsButton
                                iconPosition="left"
                                icon={<Plus />}
                                label="Criar programa"
                                onClick={() =>
                                    navigate('/clinica/programas/novo')
                                }
                            />
                        }
                    />
                ) : filtered.length === 0 ? (
                    <DsEmptyState
                        variant="no-results"
                        title="Nenhum programa encontrado"
                        action={
                            filterCount > 0 ? (
                                <DsButton
                                    variant="secondary"
                                    label="Limpar filtros"
                                    onClick={clearFilters}
                                />
                            ) : undefined
                        }
                    />
                ) : (
                    <ProgramHistoryCardGrid
                        programs={pageItems}
                        renderFooter={(p) => (
                            <ProgramHistoryCardFooter
                                program={p}
                                onAction={run}
                            />
                        )}
                    />
                )}

                <DsPagination
                    page={filters.page}
                    onPageChange={(page) => update({ page })}
                    total={filtered.length}
                    perPage={filters.perPage}
                    itemLabel="programas"
                />
            </ProgramsPageShell>
            {deleteModal}
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
                                label={`Ver ${filtered.length} ${filtered.length === 1 ? 'programa' : 'programas'}`}
                                onClick={() => setDrawerOpen(false)}
                            />
                        </div>
                    </div>
                }
            >
                <HistoryFiltersPanel
                    filters={filters}
                    professionals={professionals}
                    onChange={update}
                />
            </DsDrawer>
        </>
    );
}
