import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClinicAppointmentsRepository } from '@/infrastructure/repositories/api-clinic-appointments';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
    },
}));

import { apiClient } from '@/infrastructure/api/client';

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);
const mockPut = vi.mocked(apiClient.put);
const mockPatch = vi.mocked(apiClient.patch);

afterEach(() => {
    vi.clearAllMocks();
});

function makeApiAppointment(overrides = {}) {
    return {
        id: 7,
        patient_id: 3,
        clinic_user_id: 5,
        title: 'Avaliação',
        description: null,
        location: 'Sala 1',
        starts_at: '2026-06-20T13:00:00Z',
        ends_at: '2026-06-20T14:00:00Z',
        status: 'scheduled',
        source: 'system',
        patient: { id: 3, name: 'João' },
        clinic_user: { id: 5, name: 'Dra. Ana' },
        ...overrides,
    };
}

describe('apiClinicAppointmentsRepository.list', () => {
    it('envia filtros como query e mapeia snake → camel com relações', async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: [makeApiAppointment()] },
        });

        const result = await apiClinicAppointmentsRepository.list({
            clinicUserId: '5',
            status: 'scheduled',
        });

        const [url, config] = mockGet.mock.calls[0];
        expect(url).toBe('/clinic/appointments');
        expect(config).toMatchObject({
            params: { clinic_user_id: '5', status: 'scheduled' },
        });

        expect(result[0]).toMatchObject({
            id: '7',
            patientId: '3',
            patientName: 'João',
            clinicUserId: '5',
            clinicUserName: 'Dra. Ana',
            status: 'scheduled',
            location: 'Sala 1',
            source: 'system',
        });
    });

    it('mapeia source google e patient_id nulo', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: [
                    makeApiAppointment({
                        patient_id: null,
                        patient: null,
                        source: 'google',
                        title: 'PayMEET',
                    }),
                ],
            },
        });

        const result = await apiClinicAppointmentsRepository.list();

        expect(result[0]).toMatchObject({
            patientId: '',
            patientName: '',
            source: 'google',
            title: 'PayMEET',
        });
    });
});

describe('apiClinicAppointmentsRepository.create', () => {
    it('converte o DTO camelCase em payload snake_case', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: makeApiAppointment() },
        });

        await apiClinicAppointmentsRepository.create({
            patientId: '3',
            clinicUserId: '5',
            title: 'Avaliação',
            description: null,
            location: 'Sala 1',
            startsAt: '2026-06-20T13:00:00Z',
            endsAt: '2026-06-20T14:00:00Z',
        });

        const [url, body] = mockPost.mock.calls[0];
        expect(url).toBe('/clinic/appointments');
        expect(body).toMatchObject({
            patient_id: 3,
            clinic_user_id: 5,
            starts_at: '2026-06-20T13:00:00Z',
            ends_at: '2026-06-20T14:00:00Z',
        });
    });
});

describe('apiClinicAppointmentsRepository.updateStatus', () => {
    it('faz PATCH na rota de status com o valor', async () => {
        mockPatch.mockResolvedValueOnce({
            data: { data: makeApiAppointment({ status: 'confirmed' }) },
        });

        const result = await apiClinicAppointmentsRepository.updateStatus(
            '7',
            'confirmed',
        );

        const [url, body] = mockPatch.mock.calls[0];
        expect(url).toBe('/clinic/appointments/7/status');
        expect(body).toEqual({ status: 'confirmed' });
        expect(result.status).toBe('confirmed');
    });
});

describe('apiClinicAppointmentsRepository.cancel', () => {
    it('faz POST na rota de cancelamento', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: makeApiAppointment({ status: 'cancelled' }) },
        });

        const result = await apiClinicAppointmentsRepository.cancel('7');

        expect(mockPost).toHaveBeenCalledWith('/clinic/appointments/7/cancel');
        expect(result.status).toBe('cancelled');
    });
});

describe('apiClinicAppointmentsRepository.update', () => {
    it('faz PUT com payload snake_case', async () => {
        mockPut.mockResolvedValueOnce({
            data: { data: makeApiAppointment({ title: 'Reavaliação' }) },
        });

        const result = await apiClinicAppointmentsRepository.update('7', {
            patientId: '3',
            clinicUserId: '5',
            title: 'Reavaliação',
            startsAt: '2026-06-20T15:00:00Z',
            endsAt: '2026-06-20T16:00:00Z',
        });

        const [url, body] = mockPut.mock.calls[0];
        expect(url).toBe('/clinic/appointments/7');
        expect(body).toMatchObject({ title: 'Reavaliação' });
        expect(result.title).toBe('Reavaliação');
    });
});
