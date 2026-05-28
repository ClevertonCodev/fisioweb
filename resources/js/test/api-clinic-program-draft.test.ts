import { afterEach, describe, expect, it, vi } from 'vitest';

import { programDraftRepository } from '@/infrastructure/repositories/api-clinic-program-draft';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

import { apiClient } from '@/infrastructure/api/client';

const mockGet = vi.mocked(apiClient.get);
const mockPut = vi.mocked(apiClient.put);
const mockDelete = vi.mocked(apiClient.delete);

afterEach(() => {
    vi.clearAllMocks();
});

describe('programDraftRepository', () => {
    it('get retorna rascunho quando resposta é válida', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    step: 2,
                    selectedIds: ['10'],
                    groups: [],
                    savedAt: 1711840000000,
                },
            },
        } as any);

        const result = await programDraftRepository.get();

        expect(mockGet).toHaveBeenCalledWith('/clinic/program-drafts');
        expect(result).toEqual({
            step: 2,
            selectedIds: ['10'],
            groups: [],
            savedAt: 1711840000000,
        });
    });

    it('get retorna null quando payload não tem step numérico', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    selectedIds: [],
                    groups: [],
                    savedAt: 1,
                },
            },
        } as any);

        await expect(programDraftRepository.get()).resolves.toBeNull();
    });

    it('get retorna null quando API falha', async () => {
        mockGet.mockRejectedValueOnce(new Error('network error'));

        await expect(programDraftRepository.get()).resolves.toBeNull();
    });

    it('save envia draft para backend', async () => {
        mockPut.mockResolvedValueOnce({} as any);

        const draft = {
            step: 3 as const,
            selectedIds: ['3'],
            groups: [],
            savedAt: 1711841234000,
        };

        await programDraftRepository.save(draft);

        expect(mockPut).toHaveBeenCalledWith('/clinic/program-drafts', draft);
    });

    it('discard chama delete no endpoint', async () => {
        mockDelete.mockResolvedValueOnce({} as any);

        await programDraftRepository.discard();

        expect(mockDelete).toHaveBeenCalledWith('/clinic/program-drafts');
    });
});
