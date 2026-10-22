import { Building2, Library, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import {
    activeModelFilterCount,
    applyModelFilters,
    areaOptions,
    INITIAL_MODEL_FILTERS,
    modelChips,
    removeModelChip,
    type ModelFilters,
    type Origin,
} from '@/application/clinic/program-models';
import {
    DsButton,
    dsCn,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsFilterChips,
    DsInput,
} from '@/components/ds';
import { useIsMobile } from '@/pages/clinic/use-media-query';

import { ProgramsPageShell } from '../programs-shell/ProgramsPageShell';

import { useModels } from './data';
import { ModelFiltersBar, ModelFiltersPanel } from './parts';
import { VariantC } from './VariantC';

const ORIGIN_ITEMS = [
    { key: 'modelos', label: 'Nossos modelos', icon: <Library /> },
    { key: 'meus-modelos', label: 'Meus modelos', icon: <Building2 /> },
];

function countLabel(n: number, origin: Origin, filtered: boolean): string {
    const noun = n === 1 ? 'modelo' : 'modelos';
    if (filtered) {
        return `${n} ${noun} ${n === 1 ? 'encontrado' : 'encontrados'}`;
    }
    if (origin === 'meus') {
        return `${n} ${noun} ${n === 1 ? 'salvo' : 'salvos'} por você`;
    }
    return `${n} ${noun} ${n === 1 ? 'pronto, que já vem' : 'prontos, que já vêm'} no sistema`;
}

export default function ProgramModelsPage() {
    const navigate = useNavigate();
    const { pathname, search } = useLocation();
    const isMobile = useIsMobile();
    const origin: Origin = pathname.includes('/meus-modelos')
        ? 'meus'
        : 'nossos';

    const [filters, setFilters] = useState<ModelFilters>(INITIAL_MODEL_FILTERS);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [lastOrigin, setLastOrigin] = useState(origin);
    if (lastOrigin !== origin) {
        setLastOrigin(origin);
        setFilters((prev) => ({
            ...INITIAL_MODEL_FILTERS,
            search: prev.search,
        }));
    }
    const update = (patch: Partial<ModelFilters>) =>
        setFilters((prev) => ({ ...prev, ...patch }));
    const clearFilters = () =>
        setFilters({ ...INITIAL_MODEL_FILTERS, search: filters.search });

    const { models, isLoading, isError } = useModels(origin);
    const filtered = useMemo(
        () => applyModelFilters(models, filters),
        [models, filters],
    );
    const filterCount = activeModelFilterCount(filters);
    const isFiltered = filters.search !== '' || filterCount > 0;
    const chips = modelChips(filters);
    const canFilter = areaOptions(models).length > 0;
    const originKey = origin === 'meus' ? 'meus-modelos' : 'modelos';
    const originItem = ORIGIN_ITEMS.find((o) => o.key === originKey);

    const emptyState = isError ? (
        <DsEmptyState
            variant="error"
            title="Erro ao carregar modelos"
            description="Tente de novo em alguns instantes."
        />
    ) : !isLoading && filtered.length === 0 ? (
        <DsEmptyState
            variant={isFiltered ? 'no-results' : 'empty'}
            title={
                isFiltered
                    ? 'Nenhum modelo encontrado'
                    : origin === 'meus'
                      ? 'Você ainda não salvou modelos'
                      : 'Nenhum modelo pronto por enquanto'
            }
            description={
                isFiltered
                    ? 'Tente ajustar seus filtros ou buscar por outro termo.'
                    : origin === 'meus'
                      ? 'No Histórico, use "Transformar em modelo" num programa para guardar e usar de novo.'
                      : 'Os modelos prontos do sistema aparecem aqui.'
            }
            action={
                isFiltered ? (
                    <DsButton
                        variant="secondary"
                        label="Limpar filtros"
                        onClick={() => setFilters(INITIAL_MODEL_FILTERS)}
                    />
                ) : origin === 'meus' ? (
                    <DsButton
                        variant="secondary"
                        label="Ir para o Histórico"
                        onClick={() => navigate('/clinica/programas/historico')}
                    />
                ) : undefined
            }
        />
    ) : null;

    return (
        <>
            <ProgramsPageShell
                subtitle={
                    isLoading
                        ? 'Carregando modelos…'
                        : countLabel(filtered.length, origin, isFiltered)
                }
                filters={
                    <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap sm:gap-3 md:flex-wrap">
                        <div className="min-w-0 flex-1 max-sm:basis-full md:basis-65">
                            <DsInput
                                type="search"
                                aria-label="Pesquisar modelos"
                                placeholder={
                                    isMobile
                                        ? 'Pesquisar modelo'
                                        : origin === 'meus'
                                          ? 'Pesquisar por nome ou objetivo'
                                          : 'Pesquisar por nome, objetivo ou especialidade'
                                }
                                iconLeft={<Search />}
                                value={filters.search}
                                onValueChange={(search) => update({ search })}
                                onCleared={() => update({ search: '' })}
                            />
                        </div>
                        <DsDropdown
                            mode="radio"
                            label="Tipo de modelo"
                            icon={originItem?.icon}
                            menuTitle="Mostrar"
                            fixedLabel={originItem?.label}
                            items={ORIGIN_ITEMS}
                            value={originKey}
                            onValueChange={(key) =>
                                navigate(`/clinica/programas/${key}${search}`, {
                                    replace: true,
                                })
                            }
                        />
                        <div
                            className={dsCn(
                                'hidden flex-wrap items-center gap-3 md:flex',
                                !canFilter && 'md:hidden',
                            )}
                        >
                            <ModelFiltersBar
                                models={models}
                                filters={filters}
                                onChange={update}
                            />
                        </div>
                        <div
                            className={dsCn(
                                'ml-auto md:hidden',
                                !canFilter && 'hidden',
                            )}
                        >
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
                                setFilters(removeModelChip(filters, chip.key))
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
                <VariantC
                    models={filtered}
                    isLoading={isLoading}
                    emptyState={emptyState}
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
                                label={`Ver ${filtered.length} ${filtered.length === 1 ? 'modelo' : 'modelos'}`}
                                onClick={() => setDrawerOpen(false)}
                            />
                        </div>
                    </div>
                }
            >
                <ModelFiltersPanel
                    models={models}
                    filters={filters}
                    onChange={update}
                />
            </DsDrawer>
        </>
    );
}
