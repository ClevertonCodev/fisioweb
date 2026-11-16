import { beforeEach, describe, expect, it, vi } from 'vitest';

import { completeClinicFirstAccess } from '@/infrastructure/api/auth.service';
import { apiClient, getStoredAuth } from '@/infrastructure/api/client';

vi.mock('@/infrastructure/api/client', async (importOriginal) => {
    const original =
        await importOriginal<typeof import('@/infrastructure/api/client')>();
    return { ...original, apiClient: { post: vi.fn() } };
});

const mockPost = vi.mocked(apiClient.post);

describe('completeClinicFirstAccess', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        vi.clearAllMocks();
    });

    it('manda o token e a senha em snake_case e guarda a sessão da clínica', async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                access_token: 'token-da-sessao',
                token_type: 'bearer',
                expires_in: 3600,
                user: { id: 7, name: 'Mestre', email: 'mestre@clinica.test' },
            },
        });

        const res = await completeClinicFirstAccess({
            token: 'abc123',
            password: 'senhaDoMestre1',
            passwordConfirmation: 'senhaDoMestre1',
        });

        expect(mockPost).toHaveBeenCalledWith('/clinic/auth/first-access', {
            token: 'abc123',
            password: 'senhaDoMestre1',
            password_confirmation: 'senhaDoMestre1',
        });
        expect(res.user.id).toBe(7);
        expect(getStoredAuth('clinic')).toEqual({
            token: 'token-da-sessao',
            guard: 'clinic',
        });
    });

    it('não guarda nada quando o link é recusado', async () => {
        mockPost.mockRejectedValueOnce({
            response: { status: 422, data: { message: 'Link inválido.' } },
        });

        await expect(
            completeClinicFirstAccess({
                token: 'usado',
                password: 'senhaDoMestre1',
                passwordConfirmation: 'senhaDoMestre1',
            }),
        ).rejects.toBeTruthy();
        expect(getStoredAuth('clinic')).toBeNull();
    });
});
