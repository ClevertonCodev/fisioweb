import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiAdminExercisesRepository } from '@/infrastructure/repositories/api-admin-exercises';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);

afterEach(() => {
    vi.clearAllMocks();
});

describe('apiAdminExercisesRepository.getOptions', () => {
    it('pede as opções da criação sem exercise_id', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: { videos: [] } } });

        await apiAdminExercisesRepository.getOptions();

        expect(mockGet).toHaveBeenCalledWith('/admin/exercises/options', {
            params: {},
        });
    });

    it('pede as opções da edição com o exercise_id, para o vídeo já ligado vir junto', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    videos: [{ id: 7, original_filename: 'da-clinica.mp4' }],
                },
            },
        });

        const options = await apiAdminExercisesRepository.getOptions(42);

        expect(mockGet).toHaveBeenCalledWith('/admin/exercises/options', {
            params: { exercise_id: 42 },
        });
        expect(options.videos).toEqual([
            { id: 7, original_filename: 'da-clinica.mp4' },
        ]);
    });
});
