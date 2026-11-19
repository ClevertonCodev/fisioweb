import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicProfileRepository } from '@/infrastructure/repositories/api-clinic-profile';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        put: vi.fn(),
    },
}));

const mockPut = vi.mocked(apiClient.put);

afterEach(() => {
    vi.clearAllMocks();
});

describe('apiClinicProfileRepository.update', () => {
    it('manda os dados da clínica sem o status', async () => {
        mockPut.mockResolvedValue({
            data: {
                data: {
                    id: 7,
                    name: 'Clínica Exemplo',
                    email: 'contato@clinica.test',
                    document: '11222333000181',
                    type_person: 'juridica',
                    status: 1,
                },
            },
        });

        await apiClinicProfileRepository.update({
            name: 'Clínica Exemplo',
            typePerson: 'PJ',
            document: '11222333000181',
            email: 'contato@clinica.test',
        });

        expect(mockPut).toHaveBeenCalledTimes(1);
        const [url, payload] = mockPut.mock.calls[0];
        expect(url).toBe('/clinic/profile');
        expect(payload).toMatchObject({
            name: 'Clínica Exemplo',
            type_person: 'juridica',
            document: '11222333000181',
        });
        expect(payload).not.toHaveProperty('status');
    });

    it('lê e manda a chave do lembrete por e-mail', async () => {
        mockPut.mockResolvedValue({
            data: {
                data: {
                    id: 7,
                    name: 'Clínica Exemplo',
                    email: 'contato@clinica.test',
                    document: '11222333000181',
                    type_person: 'juridica',
                    status: 1,
                    appointment_reminder_email_enabled: true,
                },
            },
        });

        const profile = await apiClinicProfileRepository.update({
            name: 'Clínica Exemplo',
            typePerson: 'PJ',
            document: '11222333000181',
            email: 'contato@clinica.test',
            appointmentReminderEmailEnabled: true,
        });

        expect(mockPut.mock.calls[0][1]).toMatchObject({
            appointment_reminder_email_enabled: true,
        });
        expect(profile.appointmentReminderEmailEnabled).toBe(true);
    });
});
