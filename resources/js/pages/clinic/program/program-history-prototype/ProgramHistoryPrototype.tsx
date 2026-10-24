/**
 * PROTÓTIPO (descartável): aba Histórico de Programas no DS v2, na rota real
 * /clinica/programas/historico. A casca (cabeçalho, abas, busca, filtros,
 * chips e paginação) é a da lista de pacientes v2, com cartões iguais aos
 * de pacientes. ?variant=O mostra a tela atual (v1), A esta (escolhida).
 * As variantes descartadas (B tabela, C linha do tempo) estão no commit
 * que criou o protótipo.
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
    dsCn,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsFilterChips,
    DsInput,
    DsPagination,
    DsTabs,
} from '@/components/ds';
import { useIsMobile } from '@/pages/clinic/program/exercise-library-prototype/use-media-query';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';

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

export default function ProgramHistoryPrototype({
    variant,
}: {
    variant: string;
}) {
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

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        {/* No celular, "Criar programa" (com texto) desce para a largura toda. */}
                        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="min-w-0 sm:mr-auto">
                                <h1 className="text-ds-body-lg font-medium sm:text-ds-page-title sm:font-normal">
                                    Programas e exercícios
                                </h1>
                                <p className="mt-0.5 text-ds-caption text-ds-content-secondary sm:mt-1 sm:text-ds-body-sm">
                                    {isLoading
                                        ? 'Carregando programas…'
                                        : totalLabel(
                                              filtered.length,
                                              isFiltered,
                                          )}
                                </p>
                            </div>
                            <DsButton
                                size={isMobile ? 'full' : 'md'}
                                iconPosition="left"
                                icon={<Plus />}
                                label="Criar programa"
                                onClick={newProgram}
                            />
                        </header>

                        <section
                            aria-label="Seções, busca e filtros"
                            className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs sm:p-4"
                        >
                            {/* Abas no topo da caixa, separadas dos filtros por uma linha.
                                No celular, compactas e quase até a borda para caberem as três. */}
                            <div className="-mx-3 border-b border-ds-border-subtle px-1.5 pb-3 sm:-mx-4 sm:px-4 sm:pb-4">
                                <div className="w-full max-w-md">
                                    <DsTabs
                                        aria-label="Seções de programas"
                                        size={isMobile ? 'sm' : 'md'}
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
                                        iconPosition={
                                            isMobile ? 'only' : 'left'
                                        }
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
                            <div
                                className={dsCn(
                                    'flex min-h-8 items-center',
                                    // No celular, sem filtro não ocupa espaço.
                                    chips.length === 0 && 'max-sm:hidden',
                                )}
                            >
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
                            <VariantA programs={pageItems} onAction={run} />
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
