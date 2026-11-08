import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicsRepository } from '@/infrastructure/repositories/api-admin-clinics';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);

afterEach(() => {
    vi.clearAllMocks();
});

function makeApiClinic(overrides = {}) {
    return {
        id: 12,
        name: 'Clínica Exemplo',
        document: '11222333000181',
        type_person: 'juridica',
        status: 1,
        email: 'contato@clinica.test',
        created_at: '2026-11-01T10:00:00Z',
        ...overrides,
    };
}

describe('apiClinicsRepository.getById', () => {
    it('traz o estado de acesso do mestre', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: makeApiClinic({
                    master_password_defined: false,
                    first_access_link_created_at: '2026-11-08T13:45:00-03:00',
                }),
            },
        });

        const clinic = await apiClinicsRepository.getById(12);

        expect(mockGet).toHaveBeenCalledWith('/admin/clinics/12');
        expect(clinic?.masterAccess).toEqual({
            passwordDefined: false,
            lastLinkCreatedAt: '2026-11-08T13:45:00-03:00',
        });
    });

    it('deixa o estado do mestre vazio quando a API não manda os campos', async () => {
        mockGet.mockResolvedValueOnce({ data: { data: makeApiClinic() } });

        const clinic = await apiClinicsRepository.getById(12);

        expect(clinic?.masterAccess).toBeNull();
    });
});

describe('apiClinicsRepository.generateFirstAccessLink', () => {
    it('pede o link da clínica e devolve a URL e a data', async () => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({
            data: {
                data: {
                    url: 'https://app.test/clinica/primeiro-acesso?token=abc',
                    created_at: '2026-11-08T14:00:00-03:00',
                },
            },
        });

        const link = await apiClinicsRepository.generateFirstAccessLink(12);

        expect(apiClient.post).toHaveBeenCalledWith(
            '/admin/clinics/12/first-access-link',
        );
        expect(link).toEqual({
            url: 'https://app.test/clinica/primeiro-acesso?token=abc',
            createdAt: '2026-11-08T14:00:00-03:00',
        });
    });
});
