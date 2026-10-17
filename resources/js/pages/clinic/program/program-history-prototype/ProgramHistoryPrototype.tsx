/**
 * PROTÓTIPO (descartável): aba Histórico de Programas no DS v2, na rota real
 * /clinica/programas/historico. A casca (cabeçalho, abas, busca, filtros,
 * chips e paginação) é a da lista de pacientes v2; só a lista muda:
 * ?variant=O (tela atual v1), A (cartões), B (tabela), C (linha do tempo).
 *
 * Os dados são reais (até 200 programas); busca, filtros e paginação são
 * locais. Na tela de verdade, viram parâmetros da API.
 */
import { Plus, Rows3, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useClinicProfessionals } from '@/application/clinic/use-clinic-users';
import { useClinicPrograms } from '@/application/clinic/use-programs';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    DsButton,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsFilterChips,
    DsInput,
    DsPagination,
    DsTabs,
} from '@/components/ds';
import { PrototypeSwitcher } from '@/pages/clinic/agenda-prototype/PrototypeSwitcher';

import {
    activeFilterCount,
    applyFilters,
    historyChips,
    HistoryFiltersBar,
    HistoryFiltersPanel,
    INITIAL_FILTERS,
    parseDate,
    PER_PAGE_OPTIONS,
    removeChip,
    useProgramActions,
    type HistoryFilters,
} from './shared';
import { VariantA } from './VariantA';
import { VariantB } from './VariantB';
import { VariantC } from './VariantC';
import { HISTORY_VARIANTS } from './variants';

const NEW_PROGRAM_PATH = '/clinica/programas/novo';

const TABS = [
    { key: 'historico', label: 'Histórico' },
    { key: 'exercicios', label: 'Exercícios' },
    { key: 'programas', label: 'Programas' },
];

const TAB_PATHS: Record<string, string> = {
    historico: '/clinica/programas/historico',
    exercicios: '/clinica/programas/exercicios',
    programas: '/clinica/programas/modelos',
};

function totalLabel(total: number, filtered: boolean): string {
    const noun = total === 1 ? 'programa' : 'programas';
    if (filtered) {
        return `${total} ${noun} ${total === 1 ? 'encontrado' : 'encontrados'}`;
    }
    return `${total} ${noun} no histórico`;
}

function Skeletons({ variant }: { variant: string }) {
    const card = variant === 'A';
    return (
        <div
            aria-label="Carregando programas"
            className={
                card
                    ? 'grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4'
                    : 'flex flex-col gap-3'
            }
        >
            {Array.from({ length: card ? 8 : 6 }).map((_, i) => (
                <div
                    key={i}
                    className={`${card ? 'h-64' : 'h-20'} animate-pulse rounded-ds-xl bg-ds-surface-subtle`}
                />
            ))}
        </div>
    );
}

export default function ProgramHistoryPrototype({
    variant,
}: {
    variant: string;
}) {
    const navigate = useNavigate();
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
    const { run, deleteModal } = useProgramActions();

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
    const pageItems = filtered.slice(
        (filters.page - 1) * filters.perPage,
        filters.page * filters.perPage,
    );

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
            search: filters.search,
            perPage: filters.perPage,
        });
        clearPatient();
    };

    const newProgram = () => navigate(NEW_PROGRAM_PATH);

    const List = { A: VariantA, B: VariantB, C: VariantC }[variant] ?? VariantA;

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        <header className="flex flex-wrap items-center gap-4">
                            <div className="mr-auto">
                                <h1 className="text-ds-page-title">
                                    Programas e exercícios
                                </h1>
                                <p className="mt-1 text-ds-body-sm text-ds-content-secondary">
                                    {isLoading
                                        ? 'Carregando programas…'
                                        : totalLabel(
                                              filtered.length,
                                              isFiltered,
                                          )}
                                </p>
                            </div>
                            <div className="sm:hidden">
                                <DsButton
                                    iconPosition="only"
                                    icon={<Plus />}
                                    label="Criar programa"
                                    onClick={newProgram}
                                />
                            </div>
                            <div className="hidden sm:block">
                                <DsButton
                                    iconPosition="left"
                                    icon={<Plus />}
                                    label="Criar programa"
                                    onClick={newProgram}
                                />
                            </div>
                        </header>

                        <section
                            aria-label="Seções, busca e filtros"
                            className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs"
                        >
                            {/* Abas no topo da caixa, separadas dos filtros por uma linha. */}
                            <div className="-mx-4 border-b border-ds-border-subtle px-4 pb-4">
                                <div className="w-full max-w-md">
                                    <DsTabs
                                        aria-label="Seções de programas"
                                        tabs={TABS}
                                        value="historico"
                                        onValueChange={(key) => {
                                            const path = TAB_PATHS[key];
                                            if (path && key !== 'historico') {
                                                navigate(path);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="min-w-0 flex-1 basis-65">
                                    <DsInput
                                        type="search"
                                        aria-label="Pesquisar programas"
                                        placeholder="Pesquisar por paciente, programa ou profissional"
                                        iconLeft={<Search />}
                                        value={filters.search}
                                        onValueChange={(search) =>
                                            update({ search })
                                        }
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
                                        items={PER_PAGE_OPTIONS.map((o) => ({
                                            key: o.value,
                                            label: `${o.label} por página`,
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
                                            filterCount > 0
                                                ? 'primary'
                                                : 'secondary'
                                        }
                                        iconPosition="left"
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
                            <div className="flex min-h-8 items-center">
                                {chips.length > 0 ? (
                                    <DsFilterChips
                                        chips={chips}
                                        onRemove={(chip) =>
                                            chip.key === 'patient'
                                                ? clearPatient()
                                                : update(
                                                      removeChip(filters, chip),
                                                  )
                                        }
                                        onClear={clearFilters}
                                    />
                                ) : (
                                    <span className="text-ds-body-compact text-ds-content-muted">
                                        Nenhum filtro aplicado
                                    </span>
                                )}
                            </div>
                        </section>

                        {isLoading ? (
                            <Skeletons variant={variant} />
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
                                        onClick={newProgram}
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
                            <List programs={pageItems} onAction={run} />
                        )}

                        <DsPagination
                            page={filters.page}
                            onPageChange={(page) => update({ page })}
                            total={filtered.length}
                            perPage={filters.perPage}
                            itemLabel="programas"
                        />
                    </div>
                </div>
            </div>
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
            <PrototypeSwitcher variants={HISTORY_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
