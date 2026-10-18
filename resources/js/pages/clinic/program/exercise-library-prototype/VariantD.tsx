/**
 * PROTÓTIPO D (a preferida): a v1 no DS, enxuta. Filtros iguais aos do
 * Histórico v2 (caixa com as abas no topo, busca, um dropdown por filtro,
 * chips e gaveta no celular). Cartão sem moldura: vídeo arredondado com o
 * play do tamanho da referência e, embaixo, título em duas linhas +
 * estrela, especialidade e região. Rolagem infinita como na v1 (20 por
 * vez, sem paginação). O modal tem os botões de usar o exercício.
 */
import {
    Gauge,
    PersonStanding,
    Search,
    SlidersHorizontal,
    Star,
    Stethoscope,
} from 'lucide-react';
import { useState } from 'react';

import { DsButton, dsCn, DsDrawer, DsInput } from '@/components/ds';

import { ExerciseModal } from './ExerciseModal';
import { CardVideo, FavoriteButton, type VariantProps } from './media';
import {
    ActiveChips,
    CardSkeletons,
    FavoritesDropdown,
    LibraryFiltersPanel,
    useInfiniteSlice,
} from './parts';
import {
    activeFilterCount,
    FacetDropdown,
    subtitleOf,
    type FacetKey,
} from './shared';
import { useIsMobile } from './use-media-query';

const GRID =
    'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-x-6 sm:gap-y-8';

/** Os filtros da barra (e da gaveta do celular). */
const BAR_FACETS: FacetKey[] = ['specialty', 'bodyRegion', 'difficulty'];

export function VariantD(props: VariantProps) {
    const { filtered, all, filters, onChange, onToggleFavorite } = props;
    const [openId, setOpenId] = useState<string | null>(null);
    const [drawer, setDrawer] = useState(false);
    const open = all.find((e) => e.id === openId) ?? null;
    const { visible, sentinel } = useInfiniteSlice(filtered, filters);
    const filterCount = activeFilterCount(filters);
    const isMobile = useIsMobile();
    const facetProps = { exercises: all, filters, onChange };

    return (
        <>
            <section
                aria-label="Seções, busca e filtros"
                className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs sm:p-4"
            >
                {/* No celular, as abas vão quase até a borda para caberem as três. */}
                <div className="-mx-3 border-b border-ds-border-subtle px-1.5 pb-3 sm:-mx-4 sm:px-4 sm:pb-4">
                    {props.tabs}
                </div>
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
                            onValueChange={(search) => onChange({ search })}
                            onCleared={() => onChange({ search: '' })}
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
                            onChange={onChange}
                            icon={<Star />}
                        />
                    </div>
                    <div className="md:hidden">
                        <DsButton
                            variant={filterCount > 0 ? 'primary' : 'secondary'}
                            iconPosition={isMobile ? 'only' : 'left'}
                            icon={<SlidersHorizontal />}
                            label={
                                filterCount > 0
                                    ? `Filtros (${filterCount})`
                                    : 'Filtros'
                            }
                            onClick={() => setDrawer(true)}
                        />
                    </div>
                </div>
                <div
                    className={dsCn(
                        'flex min-h-8 items-center',
                        // No celular, sem filtro não ocupa espaço.
                        filterCount === 0 && 'max-sm:hidden',
                    )}
                >
                    {filterCount > 0 ? (
                        <ActiveChips {...props} />
                    ) : (
                        <span className="text-ds-body-compact text-ds-content-muted">
                            Nenhum filtro aplicado
                        </span>
                    )}
                </div>
            </section>

            {props.isLoading ? (
                <CardSkeletons className={GRID} />
            ) : (
                (props.emptyState ?? (
                    <>
                        <ul aria-label="Exercícios" className={GRID}>
                            {visible.map((e) => (
                                <li key={e.id}>
                                    <div
                                        onClick={() => setOpenId(e.id)}
                                        className="group/card cursor-pointer"
                                    >
                                        <CardVideo
                                            exercise={e}
                                            onOpen={() => setOpenId(e.id)}
                                            className="aspect-square rounded-ds-lg shadow-ds-xs"
                                        />
                                        <div className="mt-3 flex items-start gap-2">
                                            <div className="min-w-0 flex-1">
                                                <h3 className="line-clamp-2 text-ds-body-xs leading-snug font-medium text-ds-content-primary group-hover/card:text-ds-content-brand ds-dark:group-hover/card:text-ds-primary-60">
                                                    {e.title}
                                                </h3>
                                                <p className="mt-1 truncate text-ds-caption text-ds-content-muted">
                                                    {subtitleOf(e)}
                                                </p>
                                            </div>
                                            <div className="-mt-1.5 -mr-1.5">
                                                <FavoriteButton
                                                    exercise={e}
                                                    onToggle={onToggleFavorite}
                                                    look="plain"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {sentinel}
                    </>
                ))
            )}

            <DsDrawer
                open={drawer}
                onOpenChange={setDrawer}
                placement="bottom"
                title="Filtros"
                footer={
                    <div className="flex w-full items-center gap-3">
                        <DsButton
                            variant="tertiary"
                            label="Limpar"
                            disabled={filterCount === 0}
                            onClick={props.onClearFilters}
                        />
                        <div className="ml-auto">
                            <DsButton
                                label={`Ver ${filtered.length} ${filtered.length === 1 ? 'exercício' : 'exercícios'}`}
                                onClick={() => setDrawer(false)}
                            />
                        </div>
                    </div>
                }
            >
                <LibraryFiltersPanel {...facetProps} facets={BAR_FACETS} />
            </DsDrawer>
            <ExerciseModal
                exercise={open}
                onClose={() => setOpenId(null)}
                onToggleFavorite={onToggleFavorite}
            />
        </>
    );
}
