import type { Exercise, ExerciseDifficulty } from '@/domain/clinic';

export interface LibraryChip {
    key: string;
    label: string;
    value: string;
}

export type FacetKey =
    | 'specialty'
    | 'bodyArea'
    | 'bodyRegion'
    | 'difficulty'
    | 'movementType'
    | 'movementForm'
    | 'movementPattern'
    | 'source';

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

export const DIFFICULTY: Record<
    ExerciseDifficulty,
    { label: string; variant: 'success' | 'warning' | 'danger' }
> = {
    facil: { label: 'Fácil', variant: 'success' },
    medio: { label: 'Médio', variant: 'warning' },
    dificil: { label: 'Difícil', variant: 'danger' },
};

const SOURCE_LABELS: Record<string, string> = {
    catalog: 'Catálogo',
    own: 'Enviados pela clínica',
};

const DIFFICULTY_ORDER = ['facil', 'medio', 'dificil'];

const DIFFICULTY_API: Record<string, 'easy' | 'medium' | 'hard'> = {
    facil: 'easy',
    medio: 'medium',
    dificil: 'hard',
};

export interface LibraryFilters {
    search: string;
    favoritesOnly: boolean;
    facets: Record<FacetKey, string[]>;
}

export const INITIAL_LIBRARY_FILTERS: LibraryFilters = {
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

export function subtitleOf(e: Exercise): string {
    return [e.specialty, e.bodyRegion].filter(Boolean).join(' · ') || '—';
}

function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
}

export function applyLibraryFilters(
    exercises: Exercise[],
    f: LibraryFilters,
    options: { skipSearch?: boolean } = {},
): Exercise[] {
    const q = options.skipSearch ? '' : normalize(f.search.trim());
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

export interface FacetOption {
    value: string;
    label: string;
    count: number;
}

export function facetOptions(
    exercises: Exercise[],
    filters: LibraryFilters,
    key: FacetKey,
): FacetOption[] {
    const others = {
        ...filters,
        facets: { ...filters.facets, [key]: [] },
    };
    const base = applyLibraryFilters(exercises, others);
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

export function activeLibraryFilterCount(f: LibraryFilters): number {
    return (
        (f.search.trim() ? 1 : 0) +
        (f.favoritesOnly ? 1 : 0) +
        FACETS.reduce((n, { key }) => n + f.facets[key].length, 0)
    );
}

export function libraryChips(f: LibraryFilters): LibraryChip[] {
    const chips: LibraryChip[] = [];
    if (f.search.trim()) {
        chips.push({
            key: 'search',
            label: 'Busca',
            value: f.search.trim(),
        });
    }
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

export function removeLibraryChip(
    f: LibraryFilters,
    chip: Pick<LibraryChip, 'key'>,
): Partial<LibraryFilters> {
    if (chip.key === 'search') return { search: '' };
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

export function libraryApiParams(f: LibraryFilters): {
    search?: string;
    difficultyLevel?: 'easy' | 'medium' | 'hard';
} {
    const search = f.search.trim();
    const difficulties = f.facets.difficulty
        .map((d) => DIFFICULTY_API[d])
        .filter(Boolean);
    return {
        ...(search ? { search } : {}),
        ...(difficulties.length === 1
            ? { difficultyLevel: difficulties[0] }
            : {}),
    };
}
