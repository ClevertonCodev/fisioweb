/**
 * PROTÓTIPO (descartável): aba Programas (modelos) no DS v2, nas rotas reais
 * /clinica/programas/modelos e /meus-modelos. ?variant=O mostra a tela v1;
 * C (a escolhida) é o mapa do corpo, na casca do Histórico v2. As outras
 * ideias (lista + detalhe, cartões + gaveta, lista que abre, vitrine,
 * celular do paciente, blocos) foram descartadas sem commit.
 *
 * O seletor "Nossos modelos" (prontos, vêm do sistema) / "Meus modelos"
 * (os que o fisioterapeuta salvou) fica na linha dos filtros e segue as
 * rotas da v1. Dados reais; busca e filtros locais. "Usar modelo" é real.
 */
import {
    Building2,
    Library,
    Plus,
    Search,
    SlidersHorizontal,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    DsButton,
    dsCn,
    DsDrawer,
    DsDropdown,
    DsEmptyState,
    DsFilterChips,
    DsInput,
    DsTabs,
} from '@/components/ds';
import { PrototypeSwitcher } from '@/pages/clinic/PrototypeSwitcher';
import { useIsMobile } from '@/pages/clinic/program/exercise-library-prototype/use-media-query';

import {
    activeFilterCount,
    applyFilters,
    areaOptions,
    chipsOf,
    INITIAL_FILTERS,
    removeChip,
    useModels,
    type ModelFilters,
    type ModelSummary,
    type Origin,
} from './data';
import { ModelFiltersBar, ModelFiltersPanel, NEW_PROGRAM_PATH } from './parts';
import { VariantC } from './VariantC';
import { MODELS_VARIANTS } from './variants';

export interface VariantProps {
    models: ModelSummary[];
    isLoading: boolean;
    /** Vazio, sem resultado ou erro; null quando há o que mostrar. */
    emptyState: ReactNode;
}

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

/** Nossos (prontos, do sistema) × Meus (salvos pelo fisioterapeuta). */
const ORIGIN_ITEMS = [
    { key: 'modelos', label: 'Nossos modelos', icon: <Library /> },
    { key: 'meus-modelos', label: 'Meus modelos', icon: <Building2 /> },
];

function countLabel(n: number, origin: Origin, filtered: boolean): string {
    const noun = n === 1 ? 'modelo' : 'modelos';
    if (filtered)
        return `${n} ${noun} ${n === 1 ? 'encontrado' : 'encontrados'}`;
    if (origin === 'meus') {
        return `${n} ${noun} ${n === 1 ? 'salvo' : 'salvos'} por você`;
    }
    return `${n} ${noun} ${n === 1 ? 'pronto, que já vem' : 'prontos, que já vêm'} no sistema`;
}

export default function ProgramModelsPrototype({
    variant,
}: {
    variant: string;
}) {
    const navigate = useNavigate();
    const { pathname, search } = useLocation();
    const isMobile = useIsMobile();
    const origin: Origin = pathname.includes('/meus-modelos')
        ? 'meus'
        : 'nossos';

    const [filters, setFilters] = useState<ModelFilters>(INITIAL_FILTERS);
    const [drawerOpen, setDrawerOpen] = useState(false);
    // Ajuste durante o render: trocar de aba limpa a especialidade (os
    // modelos da clínica não têm), mas mantém a busca.
    const [lastOrigin, setLastOrigin] = useState(origin);
    if (lastOrigin !== origin) {
        setLastOrigin(origin);
        setFilters((prev) => ({ ...INITIAL_FILTERS, search: prev.search }));
    }
    const update = (patch: Partial<ModelFilters>) =>
        setFilters((prev) => ({ ...prev, ...patch }));
    const clearFilters = () =>
        setFilters({ ...INITIAL_FILTERS, search: filters.search });

    const { models: all, isLoading, isError } = useModels();
    const models = useMemo(
        () => all.filter((m) => m.origin === origin),
        [all, origin],
    );
    const filtered = useMemo(
        () => applyFilters(models, filters),
        [models, filters],
    );
    const filterCount = activeFilterCount(filters);
    const isFiltered = filters.search !== '' || filterCount > 0;
    const chips = chipsOf(filters);
    const canFilter = areaOptions(models).length > 0;
    const originKey = origin === 'meus' ? 'meus-modelos' : 'modelos';
    const originItem = ORIGIN_ITEMS.find((o) => o.key === originKey);
    const originLabel = originItem?.label ?? '';
    const originIcon = originItem?.icon;

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
                        onClick={() => setFilters(INITIAL_FILTERS)}
                    />
                ) : origin === 'meus' ? (
                    <DsButton
                        variant="secondary"
                        label="Ir para o Histórico"
                        onClick={() => navigate(TAB_PATHS.historico ?? '')}
                    />
                ) : undefined
            }
        />
    ) : null;

    return (
        <ClinicLayout>
            <div className="h-full overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
                <div className="px-4 py-6 sm:px-6 sm:py-8">
                    <div className="mx-auto flex max-w-(--breakpoint-ds-xl) flex-col gap-6">
                        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div className="min-w-0 sm:mr-auto">
                                <h1 className="text-ds-body-lg font-medium sm:text-ds-page-title sm:font-normal">
                                    Programas e exercícios
                                </h1>
                                <p className="mt-0.5 text-ds-caption text-ds-content-secondary sm:mt-1 sm:text-ds-body-sm">
                                    {isLoading
                                        ? 'Carregando modelos…'
                                        : countLabel(
                                              filtered.length,
                                              origin,
                                              isFiltered,
                                          )}
                                </p>
                            </div>
                            <DsButton
                                size={isMobile ? 'full' : 'md'}
                                iconPosition="left"
                                icon={<Plus />}
                                label="Criar programa"
                                onClick={() => navigate(NEW_PROGRAM_PATH)}
                            />
                        </header>

                        <section
                            aria-label="Seções, busca e filtros"
                            className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs sm:p-4"
                        >
                            <div className="-mx-3 border-b border-ds-border-subtle px-1.5 pb-3 sm:-mx-4 sm:px-4 sm:pb-4">
                                <div className="w-full max-w-md">
                                    <DsTabs
                                        aria-label="Seções de programas"
                                        size={isMobile ? 'sm' : 'md'}
                                        tabs={TABS}
                                        value="programas"
                                        onValueChange={(key) => {
                                            const path = TAB_PATHS[key];
                                            if (path && key !== 'programas') {
                                                navigate(path);
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                            {/* No celular, a busca numa linha e o tipo + filtros na de baixo. */}
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
                                        onValueChange={(search) =>
                                            update({ search })
                                        }
                                        onCleared={() => update({ search: '' })}
                                    />
                                </div>
                                {/* Como um filtro, mas sempre com um valor: é a rota da v1. */}
                                <DsDropdown
                                    mode="radio"
                                    label="Tipo de modelo"
                                    icon={originIcon}
                                    menuTitle="Mostrar"
                                    fixedLabel={originLabel}
                                    items={ORIGIN_ITEMS}
                                    value={originKey}
                                    onValueChange={(key) =>
                                        navigate(
                                            `/clinica/programas/${key}${search}`,
                                            { replace: true },
                                        )
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
                                {/* Sem especialidade para filtrar (Meus modelos), sem botão. */}
                                <div
                                    className={dsCn(
                                        'ml-auto md:hidden',
                                        !canFilter && 'hidden',
                                    )}
                                >
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
                            <div
                                className={dsCn(
                                    'flex min-h-8 items-center',
                                    // Sem o que filtrar (Meus modelos), a linha some.
                                    !canFilter && 'hidden',
                                    chips.length === 0 && 'max-sm:hidden',
                                )}
                            >
                                {chips.length > 0 ? (
                                    <DsFilterChips
                                        chips={chips}
                                        onRemove={(chip) =>
                                            setFilters(
                                                removeChip(filters, chip.key),
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

                        <VariantC
                            models={filtered}
                            isLoading={isLoading}
                            emptyState={emptyState}
                        />
                    </div>
                </div>
            </div>
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
            <PrototypeSwitcher variants={MODELS_VARIANTS} current={variant} />
        </ClinicLayout>
    );
}
