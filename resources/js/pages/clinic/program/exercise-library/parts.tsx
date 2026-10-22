/** Chips, esqueleto e filtros da biblioteca v2. */
import { useEffect, useRef, useState, type ReactNode } from 'react';

import {
    DsCheckbox,
    DsDropdown,
    DsFilterChips,
    DsRadio,
    DsRadioGroup,
} from '@/components/ds';
import type { Exercise } from '@/domain/clinic';

import {
    facetOptions,
    FACETS,
    libraryChips,
    removeChip,
    setFacet,
    type FacetKey,
    type LibraryFilters,
} from './shared';

/** Chips da v1: só aparecem com filtro, com "Limpar filtros". */
export function ActiveChips({
    filters,
    onChange,
    onClearFilters,
}: {
    filters: LibraryFilters;
    onChange: (patch: Partial<LibraryFilters>) => void;
    onClearFilters: () => void;
}) {
    const chips = libraryChips(filters);
    if (chips.length === 0) return null;
    return (
        <DsFilterChips
            chips={chips}
            onRemove={(chip) => onChange(removeChip(filters, chip))}
            onClear={onClearFilters}
        />
    );
}

/**
 * Rolagem infinita da v1 (20 por vez), simulada sobre a lista local.
 * Volta para 20 quando os filtros mudam (favoritar não reinicia).
 */
export function useInfiniteSlice(
    items: Exercise[],
    filters: LibraryFilters,
    step = 20,
) {
    const key = JSON.stringify({ ...filters, page: 0 });
    const [limit, setLimit] = useState(step);
    const [seenKey, setSeenKey] = useState(key);
    if (seenKey !== key) {
        setSeenKey(key);
        setLimit(step);
    }
    const sentinel = useRef<HTMLDivElement>(null);
    const hasMore = limit < items.length;

    useEffect(() => {
        const el = sentinel.current;
        if (!el || !hasMore) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) setLimit((n) => n + step);
            },
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, step, limit]);

    return {
        visible: items.slice(0, limit),
        sentinel: <div ref={sentinel} className="h-4" aria-hidden="true" />,
    };
}

export function CardSkeletons({
    className,
    media = 'aspect-square',
}: {
    className: string;
    media?: string;
}) {
    return (
        <div aria-label="Carregando exercícios" className={className}>
            {Array.from({ length: 8 }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-3"
                >
                    <div
                        className={`${media} animate-pulse rounded-ds-md bg-ds-surface-subtle`}
                    />
                    <div className="mt-3 h-3 w-3/4 animate-pulse rounded-ds-sm bg-ds-surface-subtle" />
                    <div className="mt-2 h-3 w-1/2 animate-pulse rounded-ds-sm bg-ds-surface-subtle" />
                </div>
            ))}
        </div>
    );
}

/**
 * Gaveta do celular no padrão do Histórico v2: os mesmos filtros da barra,
 * em grupos de checkbox e radio.
 */
export function LibraryFiltersPanel({
    exercises,
    filters,
    onChange,
    facets,
}: {
    exercises: Exercise[];
    filters: LibraryFilters;
    onChange: (patch: Partial<LibraryFilters>) => void;
    facets: FacetKey[];
}) {
    return (
        <div className="flex flex-col gap-5">
            {facets.map((key) => {
                const options = facetOptions(exercises, filters, key);
                if (options.length === 0) return null;
                const selected = filters.facets[key];
                return (
                    <fieldset
                        key={key}
                        className="flex flex-col gap-3 border-b border-ds-border-subtle pb-5"
                    >
                        <legend className="mb-3 text-ds-body-sm font-semibold text-ds-content-primary">
                            {FACETS.find((f) => f.key === key)?.label}
                        </legend>
                        {options.map((o) => (
                            <DsCheckbox
                                key={o.value}
                                label={`${o.label} (${o.count})`}
                                checked={selected.includes(o.value)}
                                onCheckedChange={(on) =>
                                    onChange(
                                        setFacet(
                                            filters,
                                            key,
                                            on === true
                                                ? [...selected, o.value]
                                                : selected.filter(
                                                      (v) => v !== o.value,
                                                  ),
                                        ),
                                    )
                                }
                            />
                        ))}
                    </fieldset>
                );
            })}
            <fieldset className="flex flex-col gap-3">
                <legend className="mb-3 text-ds-body-sm font-semibold text-ds-content-primary">
                    Favoritos
                </legend>
                <DsRadioGroup
                    name="favoritos"
                    value={filters.favoritesOnly ? 'only' : 'all'}
                    onValueChange={(v) =>
                        onChange({ favoritesOnly: v === 'only' })
                    }
                >
                    <DsRadio value="all" label="Todos os exercícios" />
                    <DsRadio value="only" label="Só favoritos" />
                </DsRadioGroup>
            </fieldset>
        </div>
    );
}

/** Favoritos como dropdown, igual aos outros filtros da barra. */
export function FavoritesDropdown({
    filters,
    onChange,
    icon,
}: {
    filters: LibraryFilters;
    onChange: (patch: Partial<LibraryFilters>) => void;
    icon: ReactNode;
}) {
    return (
        <DsDropdown
            mode="radio"
            label="Favoritos"
            icon={icon}
            fixedLabel={filters.favoritesOnly ? 'Só favoritos' : 'Favoritos'}
            items={[
                { key: 'all', label: 'Todos os exercícios' },
                { key: 'only', label: 'Só favoritos' },
            ]}
            value={filters.favoritesOnly ? 'only' : 'all'}
            onValueChange={(v) => onChange({ favoritesOnly: v === 'only' })}
        />
    );
}
