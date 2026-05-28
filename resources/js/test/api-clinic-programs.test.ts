import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClinicProgramsRepository } from '@/infrastructure/repositories/api-clinic-programs';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

import { apiClient } from '@/infrastructure/api/client';

const mockGet = vi.mocked(apiClient.get);

afterEach(() => {
    vi.clearAllMocks();
});

function makeApiPlan(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        title: 'Plano teste',
        patient_id: 10,
        patient: { id: 10, name: 'Ana Costa', photo_url: 'https://cdn.example.com/a.jpg' },
        clinic_user: { id: 2, name: 'Dr. Silva' },
        message: null,
        start_date: '2026-01-01',
        end_date: '2026-06-30',
        status: 'active',
        patient_viewed_at: null,
        patient_completed_count: 0,
        exercises_count: 7,
        groups: [],
        created_at: '2026-01-01T10:00:00.000000Z',
        ...overrides,
    };
}

function makePaginatedResponse(items: ReturnType<typeof makeApiPlan>[]) {
    return {
        data: {
            data: {
                data: items,
                total: items.length,
                last_page: 1,
                per_page: 10,
                current_page: 1,
            },
        },
    };
}

describe('apiClinicProgramsRepository.list', () => {
    it('mapeia exercises_count, foto do paciente, profissional e engajamento', async () => {
        mockGet.mockResolvedValueOnce(makePaginatedResponse([makeApiPlan()]));

        const result = await apiClinicProgramsRepository.list();

        expect(mockGet).toHaveBeenCalledWith('/clinic/treatment-plans', {
            params: { page: 1, per_page: 10 },
        });
        expect(result.items).toHaveLength(1);
        expect(result.total).toBe(1);
        expect(result.items[0]).toMatchObject({
            id: '1',
            title: 'Plano teste',
            patientId: '10',
            patientName: 'Ana Costa',
            patientPhotoUrl: 'https://cdn.example.com/a.jpg',
            professionalName: 'Dr. Silva',
            exerciseCount: 7,
            patientViewedAt: null,
            patientCompletedCount: 0,
            status: 'active',
        });
    });

    it('usa soma dos grupos quando exercises_count não vem na API', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatedResponse([
                makeApiPlan({
                    exercises_count: undefined,
                    groups: [
                        {
                            id: 1,
                            name: 'G1',
                            sort_order: 0,
                            exercises: [
                                {
                                    id: 1,
                                    exercise_id: 5,
                                    treatment_plan_group_id: 1,
                                    days_of_week: null,
                                    period: null,
                                    sets_min: 3,
                                    sets_max: 3,
                                    repetitions_min: 10,
                                    repetitions_max: 10,
                                    load_min: null,
                                    load_max: null,
                                    rest_time: null,
                                    notes: null,
                                    sort_order: 0,
                                    exercise: { id: 5, name: 'Ex A' },
                                },
                            ],
                        },
                    ],
                }),
            ]),
        );

        const result = await apiClinicProgramsRepository.list();
        expect(result.items[0].exerciseCount).toBe(1);
    });

    it('mapeia cancelled para completed no domínio', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatedResponse([makeApiPlan({ status: 'cancelled' })]),
        );

        const result = await apiClinicProgramsRepository.list();
        expect(result.items[0].status).toBe('completed');
    });
});
