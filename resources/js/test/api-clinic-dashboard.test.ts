import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicDashboardRepository } from '@/infrastructure/repositories/api-clinic-dashboard';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);

afterEach(() => {
    vi.clearAllMocks();
});

describe('apiClinicDashboardRepository.getSummary', () => {
    it('mapeia snake_case → camelCase do agregado', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    viewer: {
                        role: 'admin',
                        can_toggle_scope: true,
                        can_choose_professional: true,
                        can_view_activities: true,
                        current_scope: 'clinic',
                    },
                    cards: {
                        active_patients: 12,
                        appointments_today: 3,
                        active_programs: 5,
                        available_exercises: {
                            count: 100,
                            categories_count: 8,
                        },
                    },
                    upcoming_appointments: [
                        {
                            id: 7,
                            patient_name: 'Maria',
                            patient_photo_url: null,
                            title: 'Avaliação',
                            starts_at: '2026-06-19T09:00:00-03:00',
                            status: 'confirmed',
                        },
                    ],
                    birthdays: {
                        total: 1,
                        items: [
                            {
                                patient_id: 3,
                                name: 'João',
                                photo_url: null,
                                day: 5,
                                phone: '+5511999',
                                can_message: true,
                            },
                        ],
                    },
                },
            },
        });

        const result = await apiClinicDashboardRepository.getSummary('clinic');

        expect(result.viewer.canToggleScope).toBe(true);
        expect(result.cards.activePatients).toBe(12);
        expect(result.cards.availableExercises.categoriesCount).toBe(8);
        expect(result.upcomingAppointments[0].patientName).toBe('Maria');
        expect(result.upcomingAppointments[0].patientPhotoUrl).toBeUndefined();
        expect(result.birthdays.items[0].canMessage).toBe(true);
        expect(mockGet).toHaveBeenCalledWith('/clinic/dashboard', {
            params: { scope: 'clinic' },
        });
    });
});

describe('apiClinicDashboardRepository.getOccupancyRate', () => {
    it('mapeia a taxa de ocupação e envia os filtros', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    clinic_user_id: 9,
                    granularity: 'daily',
                    occupied_rate: 0.5,
                    buckets: [{ label: '1', rate: 0.5 }],
                },
            },
        });

        const result = await apiClinicDashboardRepository.getOccupancyRate({
            granularity: 'daily',
            clinicUserId: '9',
        });

        expect(result.clinicUserId).toBe('9');
        expect(result.occupiedRate).toBe(0.5);
        expect(result.buckets).toHaveLength(1);
        expect(mockGet).toHaveBeenCalledWith(
            '/clinic/dashboard/occupancy-rate',
            { params: { granularity: 'daily', clinic_user_id: '9' } },
        );
    });
});

describe('apiClinicDashboardRepository.getPatientAcquisition', () => {
    it('mapeia a comparação de 3 anos', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    years: [2026, 2025, 2024],
                    sources: [
                        {
                            source: 'google',
                            per_year: { '2026': 1, '2025': 2, '2024': 0 },
                            total: 3,
                            percent_total: 75,
                        },
                    ],
                    totals_per_year: { '2026': 1, '2025': 2, '2024': 0 },
                },
            },
        });

        const result =
            await apiClinicDashboardRepository.getPatientAcquisition();

        expect(result.years).toEqual([2026, 2025, 2024]);
        expect(result.sources[0].percentTotal).toBe(75);
        expect(result.sources[0].perYear['2025']).toBe(2);
    });
});

describe('apiClinicDashboardRepository.getActivities', () => {
    it('mapeia os itens do feed', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: {
                    items: [
                        {
                            id: 1,
                            type: 'patient_created',
                            description: 'Novo paciente — Maria',
                            actor_name: 'Dra. Ana',
                            created_at: '2026-06-19T08:00:00-03:00',
                        },
                    ],
                },
            },
        });

        const result = await apiClinicDashboardRepository.getActivities();

        expect(result[0].type).toBe('patient_created');
        expect(result[0].actorName).toBe('Dra. Ana');
    });
});
