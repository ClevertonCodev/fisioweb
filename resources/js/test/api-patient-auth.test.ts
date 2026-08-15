import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient, setStoredAuth } from '@/infrastructure/api/client';
import { apiPatientAuthRepository } from '@/infrastructure/repositories/api-patient-auth';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
    setStoredAuth: vi.fn(),
}));

const mockPost = vi.mocked(apiClient.post);
const mockSetStoredAuth = vi.mocked(setStoredAuth);

afterEach(() => {
    vi.clearAllMocks();
});

describe('findClinics', () => {
    it('envia o identificador e mapeia a resposta para camelCase', async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                data: [
                    {
                        id: 1,
                        name: 'Clínica Cleverton',
                        slug: 'clinica-cleverton',
                    },
                ],
            },
        } as never);

        const result =
            await apiPatientAuthRepository.findClinics('123.456.789-00');

        expect(mockPost).toHaveBeenCalledWith('/patient/auth/find-clinics', {
            identifier: '123.456.789-00',
        });
        expect(result).toEqual([
            { id: '1', name: 'Clínica Cleverton', slug: 'clinica-cleverton' },
        ]);
    });

    it('tolera slug nulo', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: [{ id: 7, name: 'Fisio Centro', slug: null }] },
        } as never);

        const result = await apiPatientAuthRepository.findClinics('a@b.com');

        expect(result[0].slug).toBeNull();
    });

    it('devolve lista vazia sem quebrar', async () => {
        mockPost.mockResolvedValueOnce({ data: { data: [] } } as never);

        await expect(
            apiPatientAuthRepository.findClinics('00000000000'),
        ).resolves.toEqual([]);
    });
});

describe('login', () => {
    it('envia identifier, password e clinic_id em snake_case', async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                access_token: 'jwt-token',
                token_type: 'bearer',
                expires_in: 3600,
                user: {
                    id: 42,
                    name: 'Maria Silva',
                    email: 'maria@exemplo.com',
                    clinic_id: 1,
                },
            },
        } as never);

        const result = await apiPatientAuthRepository.login({
            identifier: '12345678900',
            password: '12345678900',
            clinicId: '1',
        });

        expect(mockPost).toHaveBeenCalledWith('/patient/auth/login', {
            identifier: '12345678900',
            password: '12345678900',
            clinic_id: 1,
        });

        expect(result.user).toEqual({
            id: '42',
            name: 'Maria Silva',
            email: 'maria@exemplo.com',
            clinicId: '1',
        });
    });

    it('envia clinic_slug quando a clínica vem do contexto da URL', async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                access_token: 'jwt-token',
                token_type: 'bearer',
                expires_in: 3600,
                user: { id: 1, name: 'X', email: 'x@y.com', clinic_id: 1 },
            },
        } as never);

        await apiPatientAuthRepository.login({
            identifier: '04960000889',
            password: '04960000889',
            clinicSlug: 'clinica-cleverton',
        });

        expect(mockPost).toHaveBeenCalledWith('/patient/auth/login', {
            identifier: '04960000889',
            password: '04960000889',
            clinic_slug: 'clinica-cleverton',
        });
    });

    it('nunca envia clinic_id 0 quando não há id', async () => {
        // Number('') é 0 e nenhuma clínica tem id 0 — foi o que quebrou o
        // login no contexto de slug.
        mockPost.mockResolvedValueOnce({
            data: {
                access_token: 't',
                token_type: 'bearer',
                expires_in: 3600,
                user: { id: 1, name: 'X', email: 'x@y.com', clinic_id: 1 },
            },
        } as never);

        await apiPatientAuthRepository.login({
            identifier: '04960000889',
            password: '04960000889',
            clinicId: '',
            clinicSlug: 'clinica-cleverton',
        });

        const payload = mockPost.mock.calls[0][1] as Record<string, unknown>;
        expect(payload).not.toHaveProperty('clinic_id');
        expect(payload.clinic_slug).toBe('clinica-cleverton');
    });

    it('persiste o token no guard patient', async () => {
        mockPost.mockResolvedValueOnce({
            data: {
                access_token: 'jwt-token',
                token_type: 'bearer',
                expires_in: 3600,
                user: { id: 1, name: 'X', email: 'x@y.com', clinic_id: 2 },
            },
        } as never);

        await apiPatientAuthRepository.login({
            identifier: 'x@y.com',
            password: 'senha',
            clinicId: '2',
        });

        expect(mockSetStoredAuth).toHaveBeenCalledWith('jwt-token', 'patient');
    });
});
