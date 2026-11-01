import { describe, expect, it } from 'vitest';

import {
    activeLibraryFilterCount,
    applyLibraryFilters,
    INITIAL_LIBRARY_FILTERS,
    libraryApiParams,
    libraryChips,
    removeLibraryChip,
} from '@/application/clinic/exercise-library-filters';
import type { Exercise } from '@/domain/clinic';

function exercise(overrides: Partial<Exercise> = {}): Exercise {
    return {
        id: '1',
        title: 'Bird Dog',
        description: '',
        thumbnailUrl: '',
        videoUrl: '',
        specialty: 'Ortopedia',
        bodyArea: 'Coluna',
        bodyRegion: 'Lombar',
        objective: '',
        difficulty: 'facil',
        muscleGroup: 'Core',
        equipment: '',
        movementType: '',
        movementPattern: '',
        movementForm: '',
        duration: 0,
        isFavorite: false,
        reviewStatus: 'approved',
        isOwnSubmission: false,
        createdAt: '',
        ...overrides,
    };
}

describe('exercise-library-filters', () => {
    it('esconde os não favoritos no cliente', () => {
        const items = [
            exercise({ id: '1', isFavorite: true }),
            exercise({ id: '2', title: 'Agachamento', isFavorite: false }),
        ];
        const filtered = applyLibraryFilters(items, {
            ...INITIAL_LIBRARY_FILTERS,
            favoritesOnly: true,
        });
        expect(filtered.map((e) => e.id)).toEqual(['1']);
    });

    it('manda busca e dificuldade única para a API', () => {
        expect(
            libraryApiParams({
                ...INITIAL_LIBRARY_FILTERS,
                search: 'lombar',
                facets: {
                    ...INITIAL_LIBRARY_FILTERS.facets,
                    difficulty: ['facil'],
                },
            }),
        ).toEqual({ search: 'lombar', difficultyLevel: 'easy' });
    });

    it('conta a busca e o chip da busca zera só ela', () => {
        const filters = {
            ...INITIAL_LIBRARY_FILTERS,
            search: 'dog',
            favoritesOnly: true,
        };
        expect(activeLibraryFilterCount(filters)).toBe(2);
        expect(libraryChips(filters)[0]).toEqual({
            key: 'search',
            label: 'Busca',
            value: 'dog',
        });
        expect(removeLibraryChip(filters, { key: 'search' })).toEqual({
            search: '',
        });
    });
});
