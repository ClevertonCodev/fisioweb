import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicUsersRepository } from '@/infrastructure/repositories/api-clinic-users';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPut = vi.mocked(apiClient.put);
const mockDelete = vi.mocked(apiClient.delete);

afterEach(() => {
    vi.clearAllMocks();
});

function makeApiUser(overrides = {}) {
    return {
        id: 7,
        name: 'Ana Souza',
        email: 'ana@example.com',
        role: 'physiotherapist',
        mestre: 0,
        status: 1,
        ...overrides,
    };
}

describe('apiClinicUsersRepository.list', () => {
    it('converte os timestamps de 2FA e Google em booleanos', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: [
                    makeApiUser({
                        two_factor_confirmed_at: new Date().toISOString(),
                        google_connected_at: new Date().toISOString(),
                    }),
                    makeApiUser({
                        id: 8,
                        two_factor_confirmed_at: null,
                        google_connected_at: null,
                    }),
                ],
            },
        });

        const [withSignals, withoutSignals] =
            await apiClinicUsersRepository.list();

        expect(mockGet).toHaveBeenCalledWith('/clinic/users');
        expect(withSignals).toMatchObject({
            id: '7',
            twoFactorEnabled: true,
            googleConnected: true,
        });
        expect(withoutSignals).toMatchObject({
            id: '8',
            twoFactorEnabled: false,
            googleConnected: false,
        });
    });

    it('campo ausente na resposta vira false', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: [makeApiUser()] } });

        const [user] = await apiClinicUsersRepository.list();

        expect(user?.twoFactorEnabled).toBe(false);
        expect(user?.googleConnected).toBe(false);
    });
});

describe('apiClinicUsersRepository.update', () => {
    it('manda só os campos informados (PUT parcial)', async () => {
        mockPut.mockResolvedValue({ data: { data: makeApiUser() } });

        await apiClinicUsersRepository.update('7', { role: 'secretary' });
        await apiClinicUsersRepository.update('7', { status: 0 });

        expect(mockPut).toHaveBeenNthCalledWith(1, '/clinic/users/7', {
            role: 'secretary',
        });
        expect(mockPut).toHaveBeenNthCalledWith(2, '/clinic/users/7', {
            status: 0,
        });
    });
});

describe('apiClinicUsersRepository.destroy', () => {
    it('chama o DELETE do usuário', async () => {
        mockDelete.mockResolvedValueOnce({ data: {} });

        await apiClinicUsersRepository.destroy('7');

        expect(mockDelete).toHaveBeenCalledWith('/clinic/users/7');
    });
});
