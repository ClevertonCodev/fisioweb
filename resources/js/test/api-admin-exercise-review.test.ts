import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiAdminExerciseReviewRepository } from '@/infrastructure/repositories/api-admin-exercise-review';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: { get: vi.fn(), put: vi.fn() },
}));

const mockGet = vi.mocked(apiClient.get);

function proposal(videoId: number) {
    return {
        video_id: videoId,
        proposal_version: `v${videoId}`,
        proposed_at: '2026-11-11T10:00:00Z',
        proposed_by_clinic_user_id: 1,
        current: { thumbnail_url: null, reference_images: [] },
        proposed: { thumbnail_url: null, reference_images: [] },
        exercise: {
            id: videoId * 10,
            name: `Exercício ${videoId}`,
            review_status: 'approved',
            clinic: { id: 1, name: 'Clínica' },
        },
        linked_exercises: [],
    };
}

afterEach(() => {
    vi.clearAllMocks();
});

describe('apiAdminExerciseReviewRepository', () => {
    it('busca todas as páginas da fila de mídia proposta', async () => {
        mockGet
            .mockResolvedValueOnce({
                data: {
                    data: [proposal(1), proposal(2)],
                    meta: {
                        current_page: 1,
                        per_page: 2,
                        total: 3,
                        last_page: 2,
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    data: [proposal(3)],
                    meta: {
                        current_page: 2,
                        per_page: 2,
                        total: 3,
                        last_page: 2,
                    },
                },
            });

        const proposals =
            await apiAdminExerciseReviewRepository.listMediaProposals();

        expect(proposals.map((p) => p.videoId)).toEqual([1, 2, 3]);
        expect(mockGet).toHaveBeenNthCalledWith(
            2,
            '/admin/exercises/media-proposals',
            { params: { per_page: 100, page: 2 } },
        );
    });

    it('busca todas as páginas dos exercícios pendentes', async () => {
        mockGet
            .mockResolvedValueOnce({
                data: {
                    data: {
                        data: [{ id: 1, name: 'A' }],
                        current_page: 1,
                        last_page: 2,
                    },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    data: {
                        data: [{ id: 2, name: 'B' }],
                        current_page: 2,
                        last_page: 2,
                    },
                },
            });

        const pending = await apiAdminExerciseReviewRepository.listPending();

        expect(pending.map((e) => e.id)).toEqual([1, 2]);
        expect(mockGet).toHaveBeenNthCalledWith(2, '/admin/exercises', {
            params: { review_status: 'pending', per_page: 100, page: 2 },
        });
    });
});
