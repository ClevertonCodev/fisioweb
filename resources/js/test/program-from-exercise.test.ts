import { describe, expect, it } from 'vitest';

import { programDraftFromExercise } from '@/application/clinic/program-from-exercise';
import type { Exercise } from '@/domain/clinic';

function exercise(overrides: Partial<Exercise> = {}): Exercise {
    return {
        id: '42',
        title: 'Bird Dog',
        description: '',
        thumbnailUrl: 'https://exemplo.test/t.jpg',
        videoUrl: 'https://exemplo.test/v.mp4',
        specialty: 'Ortopedia',
        bodyArea: 'Coluna',
        bodyRegion: 'Lombar',
        objective: '',
        difficulty: 'facil',
        muscleGroup: '',
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

describe('programDraftFromExercise', () => {
    it('monta um programa com um grupo e o exercício escolhido', () => {
        const draft = programDraftFromExercise(exercise());
        expect(draft.groups).toHaveLength(1);
        expect(draft.groups[0]?.exercises).toEqual([
            expect.objectContaining({
                exerciseId: '42',
                title: 'Bird Dog',
            }),
        ]);
        expect(draft.patientId).toBeNull();
        expect(draft.status).toBe('draft');
    });

    it('o exercício entra com a dose padrão do catálogo', () => {
        const draft = programDraftFromExercise(
            exercise({ sets: 3, repetitions: 12, restTime: 45 }),
        );
        expect(draft.groups[0]?.exercises[0]).toMatchObject({
            seriesMin: 3,
            seriesMax: 3,
            repetitionsMin: 12,
            repetitionsMax: 12,
            restTime: 45,
            isConfigured: true,
        });
    });

    it('sem dose no catálogo, o exercício entra sem dose', () => {
        const draft = programDraftFromExercise(exercise());
        expect(draft.groups[0]?.exercises[0]).toMatchObject({
            seriesMin: null,
            repetitionsMin: null,
            isConfigured: false,
        });
    });
});
