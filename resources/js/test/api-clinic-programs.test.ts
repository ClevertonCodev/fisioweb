import { AxiosError, type AxiosResponse } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildProgramWriteDto } from '@/application/clinic/program-write';
import { apiClient } from '@/infrastructure/api/client';
import { apiClinicProgramsRepository } from '@/infrastructure/repositories/api-clinic-programs';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);

afterEach(() => {
    vi.clearAllMocks();
});

function makeApiPlan(overrides: Record<string, unknown> = {}) {
    return {
        id: 1,
        title: 'Plano teste',
        patient_id: 10,
        patient: {
            id: 10,
            name: 'Ana Costa',
            photo_url: 'https://cdn.example.com/a.jpg',
        },
        clinic_user: {
            id: 2,
            name: 'Dr. Silva',
            photo_url: 'https://cdn.example.com/dr.jpg',
        },
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
    it('manda o recorte por paciente como patient_id', async () => {
        mockGet.mockResolvedValueOnce(makePaginatedResponse([]));

        await apiClinicProgramsRepository.list({
            page: 2,
            perPage: 200,
            patientId: '10',
        });

        expect(mockGet).toHaveBeenCalledWith('/clinic/treatment-plans', {
            params: { page: 2, per_page: 200, patient_id: '10' },
        });
    });

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
            professionalPhotoUrl: 'https://cdn.example.com/dr.jpg',
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

    it('envia patientId como patient_id', async () => {
        mockGet.mockResolvedValueOnce(makePaginatedResponse([]));

        await apiClinicProgramsRepository.list({
            patientId: '10',
            perPage: 20,
            page: 2,
        });

        expect(mockGet).toHaveBeenCalledWith('/clinic/treatment-plans', {
            params: { page: 2, per_page: 20, patient_id: '10' },
        });
    });
});

describe('apiClinicProgramsRepository.fetchPdfBlob', () => {
    it('busca PDF com responseType blob', async () => {
        const blob = new Blob(['%PDF'], { type: 'application/pdf' });
        mockGet.mockResolvedValueOnce({ data: blob });

        const result = await apiClinicProgramsRepository.fetchPdfBlob('42');

        expect(mockGet).toHaveBeenCalledWith('/clinic/treatment-plans/42/pdf', {
            responseType: 'blob',
        });
        expect(result).toBe(blob);
    });
});

describe('apiClinicProgramsRepository.getById', () => {
    it('devolve null quando a API responde 404 (outra clínica ou excluído)', async () => {
        mockGet.mockRejectedValueOnce(
            new AxiosError('Not Found', '404', undefined, undefined, {
                status: 404,
            } as AxiosResponse),
        );

        await expect(
            apiClinicProgramsRepository.getById('99'),
        ).resolves.toBeNull();
    });

    it('repassa erro que não é 404', async () => {
        mockGet.mockRejectedValueOnce(
            new AxiosError('Server Error', '500', undefined, undefined, {
                status: 500,
            } as AxiosResponse),
        );

        await expect(apiClinicProgramsRepository.getById('99')).rejects.toThrow(
            'Server Error',
        );
    });
});

describe('apiClinicProgramsRepository: datas do programa', () => {
    it('guarda início e fim só com o dia, sem virar o dia anterior no fuso de Brasília', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                data: makeApiPlan({
                    start_date: '2026-08-10T00:00:00.000000Z',
                    end_date: '2026-09-29T00:00:00.000000Z',
                }),
            },
        });

        const program = await apiClinicProgramsRepository.getById('7');

        expect(program?.startDate).toBe('2026-08-10');
        expect(program?.endDate).toBe('2026-09-29');
    });

    it('mantém o fim vazio como null', async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: makeApiPlan({ end_date: null }) },
        });

        const program = await apiClinicProgramsRepository.getById('7');

        expect(program?.endDate).toBeNull();
    });
});

describe('apiClinicProgramsRepository.update: payload da edição', () => {
    const dto = {
        title: 'Joelho',
        patientId: null,
        message: '',
        startDate: '2026-11-01',
        endDate: null,
        groups: [
            { id: 7, name: 'Principal', sortOrder: 0 },
            { name: 'Novo', sortOrder: 1 },
        ],
        exercises: [
            {
                id: 70,
                exerciseId: 100,
                groupIndex: 0,
                days: [],
                period: null,
                setsMin: 3,
                setsMax: 3,
            },
            {
                exerciseId: 200,
                groupIndex: 1,
                days: [1],
                period: 'manha' as const,
                setsMin: null,
                setsMax: null,
            },
        ],
    };

    it('manda o id do que já existe e omite o do que é novo', async () => {
        vi.mocked(apiClient.put).mockResolvedValueOnce({
            data: { data: makeApiPlan() },
        });
        await apiClinicProgramsRepository.update('5', dto);

        const payload = vi.mocked(apiClient.put).mock.calls[0]?.[1] as Record<
            string,
            unknown[]
        >;
        expect(payload.groups).toEqual([
            { id: 7, name: 'Principal', sort_order: 0 },
            { name: 'Novo', sort_order: 1 },
        ]);
        expect(payload.exercises?.[0]).toMatchObject({
            id: 70,
            exercise_id: 100,
        });
        expect(payload.exercises?.[1]).not.toHaveProperty('id');
    });

    it('manda null para tirar paciente, mensagem e término (em vez de omitir)', async () => {
        vi.mocked(apiClient.put).mockResolvedValueOnce({
            data: { data: makeApiPlan() },
        });
        await apiClinicProgramsRepository.update('5', dto);

        const payload = vi.mocked(apiClient.put).mock.calls[0]?.[1] as Record<
            string,
            unknown
        >;
        expect(payload).toMatchObject({
            patient_id: null,
            message: null,
            end_date: null,
        });
        expect(payload).not.toHaveProperty('status');
    });
});

describe('apiClinicProgramsRepository: período do exercício', () => {
    it('o período do assistente (manha/tarde/noite) chega ao backend em inglês', async () => {
        vi.mocked(apiClient.post).mockResolvedValueOnce({
            data: { data: makeApiPlan() },
        });
        await apiClinicProgramsRepository.create(
            buildProgramWriteDto({
                details: {
                    title: 'X',
                    patientId: '',
                    message: '',
                    startDate: null,
                    endDate: null,
                },
                groups: [
                    {
                        id: 'g',
                        name: 'G',
                        exercises: (
                            ['manha', 'tarde', 'noite', null] as const
                        ).map((period, i) => ({
                            id: `e${i}`,
                            exerciseId: '10',
                            title: '',
                            thumbnailUrl: '',
                            videoUrl: '',
                            days: [],
                            period,
                            seriesMin: null,
                            seriesMax: null,
                            isConfigured: false,
                        })),
                    },
                ],
            }),
        );

        const payload = vi.mocked(apiClient.post).mock.calls[0]?.[1] as {
            exercises: { period: string | null }[];
        };
        expect(payload.exercises.map((e) => e.period)).toEqual([
            'morning',
            'afternoon',
            'night',
            null,
        ]);
    });
});
