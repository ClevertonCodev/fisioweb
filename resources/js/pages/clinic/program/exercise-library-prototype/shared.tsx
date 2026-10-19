/**
 * PROTÓTIPO (descartável): peças comuns às variantes da aba Exercícios v2.
 * Favoritar é real (a mesma chamada da v1); o resto é só leitura.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, type ReactNode } from 'react';

import {
    listExercisesPaginated,
    useToggleExerciseFavorite,
} from '@/application/clinic/use-exercises';
import {
    DsDropdown,
    type BadgeVariant,
    type FilterChip,
} from '@/components/ds';
import type { Exercise, ExerciseDifficulty } from '@/domain/clinic';

// ---------------------------------------------------------------- dados

/** Até 200 exercícios de uma vez; busca, filtros e paginação são locais. */
export function useExerciseLibrary() {
    const query = useQuery({
        queryKey: ['exercises', 'prototype-library'],
        queryFn: () => listExercisesPaginated({ page: 1, perPage: 200 }),
    });
    const toggle = useToggleExerciseFavorite();
    const [overrides, setOverrides] = useState<Record<string, boolean>>({});

    const exercises = useMemo(
        () =>
            (query.data?.items ?? [])
                .map((e) =>
                    e.id in overrides
                        ? { ...e, isFavorite: overrides[e.id] as boolean }
                        : e,
                )
                .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR')),
        [query.data, overrides],
    );

    const toggleFavorite = (exercise: Exercise) => {
        const next = !exercise.isFavorite;
        setOverrides((prev) => ({ ...prev, [exercise.id]: next }));
        toggle.mutate(exercise.id, {
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

    return {
        exercises,
        isLoading: query.isLoading,
        isError: query.isError,
        toggleFavorite,
    };
}

// ---------------------------------------------------------------- rótulos

export const DIFFICULTY: Record<
    ExerciseDifficulty,
    { label: string; variant: BadgeVariant }
> = {
    facil: { label: 'Fácil', variant: 'success' },
    medio: { label: 'Médio', variant: 'warning' },
    dificil: { label: 'Difícil', variant: 'danger' },
};

export function subtitleOf(e: Exercise): string {
    return [e.specialty, e.bodyRegion].filter(Boolean).join(' · ') || '—';
}

// ---------------------------------------------------------------- filtros

export type FacetKey =
    | 'specialty'
    | 'bodyArea'
    | 'bodyRegion'
    | 'difficulty'
    | 'movementType'
    | 'movementForm'
    | 'movementPattern'
    | 'source';

/**
 * Objetivo e grupo muscular são texto livre ("Glúteo máximo, isquiotibiais,
 * paravertebrais"), então não viram faceta: entram na busca.
 */
export const FACETS: { key: FacetKey; label: string }[] = [
    { key: 'specialty', label: 'Especialidade' },
    { key: 'bodyRegion', label: 'Região do corpo' },
    { key: 'difficulty', label: 'Dificuldade' },
    { key: 'bodyArea', label: 'Subárea' },
    { key: 'movementType', label: 'Tipo de movimento' },
    { key: 'movementForm', label: 'Forma' },
    { key: 'movementPattern', label: 'Cadeia cinética' },
    { key: 'source', label: 'Origem' },
];

const SOURCE_LABELS: Record<string, string> = {
    catalog: 'Catálogo',
    own: 'Enviados pela clínica',
};

function facetValue(e: Exercise, key: FacetKey): string {
    if (key === 'source') return e.isOwnSubmission ? 'own' : 'catalog';
    return e[key];
}

export function facetLabel(key: FacetKey, value: string): string {
    if (key === 'difficulty') {
        return DIFFICULTY[value as ExerciseDifficulty]?.label ?? value;
    }
    if (key === 'source') return SOURCE_LABELS[value] ?? value;
    if (key === 'movementForm') {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
    return value;
}

export interface LibraryFilters {
    search: string;
    favoritesOnly: boolean;
    facets: Record<FacetKey, string[]>;
    page: number;
    perPage: number;
}

export const INITIAL_FILTERS: LibraryFilters = {
    search: '',
    favoritesOnly: false,
    facets: {
        specialty: [],
        bodyArea: [],
        bodyRegion: [],
        difficulty: [],
        movementType: [],
        movementForm: [],
        movementPattern: [],
        source: [],
    },
    page: 1,
    perPage: 16,
};

const DIFFICULTY_ORDER = ['facil', 'medio', 'dificil'];

export interface FacetOption {
    value: string;
    label: string;
    count: number;
}

/**
 * Opções de cada faceta com a contagem considerando os outros filtros
 * (o padrão de loja: a faceta não zera a si mesma).
 */
export function facetOptions(
    exercises: Exercise[],
    filters: LibraryFilters,
    key: FacetKey,
): FacetOption[] {
    const others = {
        ...filters,
        facets: { ...filters.facets, [key]: [] },
    };
    const base = applyFilters(exercises, others);
    const counts: Record<string, number> = {};
    for (const e of exercises) {
        const v = facetValue(e, key);
        if (v) counts[v] = 0;
    }
    for (const e of base) {
        const v = facetValue(e, key);
        if (v) counts[v] = (counts[v] ?? 0) + 1;
    }
    return Object.entries(counts)
        .map(([value, count]) => ({
            value,
            label: facetLabel(key, value),
            count,
        }))
        .sort((a, b) =>
            key === 'difficulty'
                ? DIFFICULTY_ORDER.indexOf(a.value) -
                  DIFFICULTY_ORDER.indexOf(b.value)
                : a.label.localeCompare(b.label, 'pt-BR'),
        );
}

function normalize(text: string): string {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Filtro local (protótipo). Na tela real isso vira parâmetro da API. */
export function applyFilters(
    exercises: Exercise[],
    f: LibraryFilters,
): Exercise[] {
    const q = normalize(f.search.trim());
    return exercises.filter((e) => {
        if (f.favoritesOnly && !e.isFavorite) return false;
        if (
            q &&
            !normalize(
                `${e.title} ${e.specialty} ${e.bodyArea} ${e.bodyRegion} ${e.muscleGroup} ${e.objective}`,
            ).includes(q)
        ) {
            return false;
        }
        for (const { key } of FACETS) {
            const selected = f.facets[key];
            if (selected.length && !selected.includes(facetValue(e, key))) {
                return false;
            }
        }
        return true;
    });
}

export function activeFilterCount(f: LibraryFilters): number {
    return (
        (f.favoritesOnly ? 1 : 0) +
        FACETS.reduce((n, { key }) => n + f.facets[key].length, 0)
    );
}

export function libraryChips(f: LibraryFilters): FilterChip[] {
    const chips: FilterChip[] = [];
    if (f.favoritesOnly) {
        chips.push({ key: 'fav', label: 'Mostrar', value: 'Só favoritos' });
    }
    for (const { key, label } of FACETS) {
        for (const value of f.facets[key]) {
            chips.push({
                key: `${key}:${value}`,
                label,
                value: facetLabel(key, value),
            });
        }
    }
    return chips;
}

export function removeChip(
    f: LibraryFilters,
    chip: FilterChip,
): Partial<LibraryFilters> {
    if (chip.key === 'fav') return { favoritesOnly: false };
    const [key, ...rest] = chip.key.split(':');
    const value = rest.join(':');
    const facet = key as FacetKey;
    return {
        facets: {
            ...f.facets,
            [facet]: f.facets[facet].filter((v) => v !== value),
        },
    };
}

export function setFacet(
    f: LibraryFilters,
    key: FacetKey,
    values: string[],
): Partial<LibraryFilters> {
    return { facets: { ...f.facets, [key]: values } };
}

function multiLabel(name: string, selected: string[]): string {
    if (selected.length === 0) return name;
    if (selected.length === 1) return selected[0] as string;
    return `${name} (${selected.length})`;
}

export interface FiltersProps {
    exercises: Exercise[];
    filters: LibraryFilters;
    onChange: (patch: Partial<LibraryFilters>) => void;
}

/** Um dropdown de checkbox para uma faceta, com a contagem no item. */
export function FacetDropdown({
    exercises,
    filters,
    onChange,
    facet,
    icon,
    menuAlign,
}: FiltersProps & {
    facet: FacetKey;
    icon: ReactNode;
    menuAlign?: 'left' | 'right';
}) {
    const def = FACETS.find((x) => x.key === facet)!;
    const options = facetOptions(exercises, filters, facet);
    if (options.length === 0) return null;
    return (
        <DsDropdown
            mode="checkbox"
            label={def.label}
            icon={icon}
            menuWidth={240}
            menuAlign={menuAlign}
            fixedLabel={multiLabel(
                def.label,
                filters.facets[facet].map((v) => facetLabel(facet, v)),
            )}
            // Sem `badge`: no DS ele destaca um item especial (pinta a linha
            // com o degradê da marca), não serve para contagem.
            items={options.map((o) => ({ key: o.value, label: o.label }))}
            value={filters.facets[facet]}
            onValueChange={(v) =>
                onChange(setFacet(filters, facet, v as string[]))
            }
        />
    );
}

// ---------------------------------------------------------------- variantes
