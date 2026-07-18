import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicExercisesRepository } from '@/infrastructure/repositories/api-clinic-exercises';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

afterEach(() => {
    vi.clearAllMocks();
});

function makeApiExercise(overrides = {}) {
    return {
        id: 10,
        name: 'Ponte Glútea',
        physio_area: { name: 'Ortopedia' },
        physio_subarea: null,
        body_region: null,
        therapeutic_goal: null,
        difficulty_level: 'easy' as const,
        muscle_group: null,
        movement_type: null,
        movement_form: null,
        kinetic_chain: null,
        is_favorite: false,
        review_status: 'pending' as const,
        is_own_submission: true,
        videos: [],
        created_at: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('apiClinicExercisesRepository.submit', () => {
    it('envia POST /clinic/exercises com o payload mapeado', async () => {
        mockPost.mockResolvedValueOnce({ data: { data: makeApiExercise() } });

        await apiClinicExercisesRepository.submit({
            name: 'Ponte Glútea',
            physioAreaId: 3,
            difficultyLevel: 'easy',
            description: 'desc',
            videoId: 42,
        });

        expect(mockPost).toHaveBeenCalledWith('/clinic/exercises', {
            name: 'Ponte Glútea',
            physio_area_id: 3,
            difficulty_level: 'easy',
            description: 'desc',
            video_id: 42,
        });
    });

    it('mapeia review_status e is_own_submission na entidade retornada', async () => {
        mockPost.mockResolvedValueOnce({ data: { data: makeApiExercise() } });

        const ex = await apiClinicExercisesRepository.submit({
            name: 'Ponte Glútea',
            physioAreaId: 3,
            difficultyLevel: 'easy',
            videoId: 42,
        });

        expect(ex.reviewStatus).toBe('pending');
        expect(ex.isOwnSubmission).toBe(true);
    });
});

describe('apiClinicExercisesRepository.list — campos de revisão', () => {
    it('usa approved como padrão quando review_status ausente', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    data: [
                        makeApiExercise({
                            review_status: null,
                            is_own_submission: false,
                        }),
                    ],
                    current_page: 1,
                    last_page: 1,
                    per_page: 200,
                    total: 1,
                },
            },
        });

        const [ex] = await apiClinicExercisesRepository.list();
        expect(ex.reviewStatus).toBe('approved');
        expect(ex.isOwnSubmission).toBe(false);
    });
});
