/**
 * Grade D da biblioteca: cartão sem moldura, rolagem infinita e modal da
 * ficha. Com `selection` (assistente), o cartão marca o exercício e o
 * modal vira "Adicionar ao programa".
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
import { useIsMobile } from '@/pages/clinic/use-media-query';

import { ExerciseModal } from './ExerciseModal';
import {
    CardVideo,
    FavoriteButton,
    SelectToggle,
    type VariantProps,
} from './media';
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

const GRID =
    'grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-x-6 sm:gap-y-8';

/** Os filtros da barra (e da gaveta do celular). */
const BAR_FACETS: FacetKey[] = ['specialty', 'bodyRegion', 'difficulty'];

export function VariantD(props: VariantProps) {
    const { filtered, all, filters, onChange, onToggleFavorite, selection } =
        props;
    const [openId, setOpenId] = useState<string | null>(null);
    const [drawer, setDrawer] = useState(false);
    const open = all.find((e) => e.id === openId) ?? null;
    const local = useInfiniteSlice(filtered, filters);
    const visible = props.embedded ? filtered : local.visible;
    const sentinel = props.embedded ? props.sentinel : local.sentinel;
    const filterCount = activeFilterCount(filters);
    const isMobile = useIsMobile();
    const facetProps = { exercises: all, filters, onChange };

    return (
        <>
            {!props.embedded && (
                <section
                    aria-label="Seções, busca e filtros"
                    className="flex flex-col gap-3 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs sm:p-4"
                >
                    {/* No celular, as abas vão quase até a borda para caberem as três. */}
                    {props.tabs && (
                        <div className="-mx-3 border-b border-ds-border-subtle px-1.5 pb-3 sm:-mx-4 sm:px-4 sm:pb-4">
                            {props.tabs}
                        </div>
                    )}
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
            )}

            {props.isLoading ? (
                <CardSkeletons className={GRID} />
            ) : (
                (props.emptyState ?? (
                    <>
                        <ul aria-label="Exercícios" className={GRID}>
                            {visible.map((e) => {
                                const picked =
                                    selection?.isSelected(e) ?? false;
                                return (
                                    <li key={e.id}>
                                        <div
                                            onClick={() => setOpenId(e.id)}
                                            className="group/card cursor-pointer"
                                        >
                                            <CardVideo
                                                exercise={e}
                                                onOpen={() => setOpenId(e.id)}
                                                className={dsCn(
                                                    'aspect-square rounded-ds-lg shadow-ds-xs',
                                                    picked &&
                                                        'ring-3 ring-ds-primary-80 ring-offset-2 ring-offset-ds-surface-body ds-dark:ring-ds-primary-60',
                                                )}
                                                topRight={
                                                    selection && (
                                                        <SelectToggle
                                                            exercise={e}
                                                            selected={picked}
                                                            onToggle={() =>
                                                                selection.onToggle(
                                                                    e,
                                                                )
                                                            }
                                                        />
                                                    )
                                                }
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
                                                        onToggle={
                                                            onToggleFavorite
                                                        }
                                                        look="plain"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        {sentinel}
                    </>
                ))
            )}

            {!props.embedded && (
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
            )}
            <ExerciseModal
                exercise={open}
                onClose={() => setOpenId(null)}
                onToggleFavorite={onToggleFavorite}
                selection={selection}
            />
        </>
    );
}
