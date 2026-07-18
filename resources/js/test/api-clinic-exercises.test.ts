import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/infrastructure/api/client';
import { apiClinicExercisesRepository } from '@/infrastructure/repositories/api-clinic-exercises';

vi.mock('@/infrastructure/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

const mockGet = vi.mocked(apiClient.get);
const mockPost = vi.mocked(apiClient.post);

afterEach(() => {
    vi.clearAllMocks();
});

function makeVideo(overrides = {}) {
    return {
        id: 1,
        url: 'http://storage.example.com/video.mp4',
        cdn_url: null as string | null,
        thumbnail_url: 'http://storage.example.com/thumb.jpg',
        duration: 30,
        status: 'completed',
        ...overrides,
    };
}

function makeApiExercise(overrides = {}) {
    return {
        id: 1,
        name: 'Bird Dog',
        physio_area: { name: 'Traumato-Ortopédica' },
        physio_subarea: { name: 'Coluna' },
        body_region: { name: 'Lombar' },
        therapeutic_goal: 'Estabilização',
        difficulty_level: 'easy' as 'easy' | 'medium' | 'hard' | null,
        muscle_group: 'Core',
        movement_type: 'Isométrico',
        movement_form: 'Unilateral',
        kinetic_chain: 'Fechada',
        is_favorite: false,
        videos: [makeVideo()],
        created_at: '2024-01-01T00:00:00Z',
        ...overrides,
    };
}

function makePaginatorResponse(
    exercises: ReturnType<typeof makeApiExercise>[],
) {
    return {
        data: {
            data: {
                data: exercises,
                current_page: 1,
                last_page: 1,
                per_page: 200,
                total: exercises.length,
            },
        },
    };
}

describe('apiClinicExercisesRepository.list', () => {
    it('requisita /clinic/exercises com per_page 200', async () => {
        mockGet.mockResolvedValueOnce(makePaginatorResponse([]));
        await apiClinicExercisesRepository.list();
        expect(mockGet).toHaveBeenCalledWith('/clinic/exercises', {
            params: { per_page: 200 },
        });
    });

    it('retorna array vazio quando a resposta não tem dados', async () => {
        mockGet.mockResolvedValueOnce({ data: {} });
        const result = await apiClinicExercisesRepository.list();
        expect(result).toEqual([]);
    });

    it('mapeia id numérico para string', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([makeApiExercise({ id: 42 })]),
        );
        const [exercise] = await apiClinicExercisesRepository.list();
        expect(exercise.id).toBe('42');
    });

    it('mapeia campos de relação para strings', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([
                makeApiExercise({
                    physio_area: { name: 'Neurofuncional' },
                    physio_subarea: { name: 'Membros superiores' },
                    body_region: { name: 'Ombro' },
                    therapeutic_goal: 'Fortalecimento',
                    muscle_group: 'Deltóide',
                }),
            ]),
        );
        const [ex] = await apiClinicExercisesRepository.list();
        expect(ex.specialty).toBe('Neurofuncional');
        expect(ex.bodyArea).toBe('Membros superiores');
        expect(ex.bodyRegion).toBe('Ombro');
        expect(ex.objective).toBe('Fortalecimento');
        expect(ex.muscleGroup).toBe('Deltóide');
    });

    it('retorna string vazia quando relações são null', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([
                makeApiExercise({
                    physio_area: null,
                    physio_subarea: null,
                    body_region: null,
                    therapeutic_goal: null,
                    muscle_group: null,
                    movement_type: null,
                    movement_form: null,
                    kinetic_chain: null,
                }),
            ]),
        );
        const [ex] = await apiClinicExercisesRepository.list();
        expect(ex.specialty).toBe('');
        expect(ex.bodyArea).toBe('');
        expect(ex.bodyRegion).toBe('');
        expect(ex.objective).toBe('');
        expect(ex.muscleGroup).toBe('');
        expect(ex.movementType).toBe('');
        expect(ex.movementForm).toBe('');
        expect(ex.movementPattern).toBe('');
    });

    it('mapeia is_favorite para isFavorite', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([makeApiExercise({ is_favorite: true })]),
        );
        const [ex] = await apiClinicExercisesRepository.list();
        expect(ex.isFavorite).toBe(true);
    });
});

describe('apiClinicExercisesRepository — mapeamento de dificuldade', () => {
    async function getDifficulty(level: 'easy' | 'medium' | 'hard' | null) {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([
                makeApiExercise({ difficulty_level: level }),
            ]),
        );
        const [ex] = await apiClinicExercisesRepository.list();
        return ex.difficulty;
    }

    it('mapeia easy → facil', async () =>
        expect(await getDifficulty('easy')).toBe('facil'));
    it('mapeia medium → medio', async () =>
        expect(await getDifficulty('medium')).toBe('medio'));
    it('mapeia hard → dificil', async () =>
        expect(await getDifficulty('hard')).toBe('dificil'));
    it('usa facil como padrão quando difficulty_level é null', async () =>
        expect(await getDifficulty(null)).toBe('facil'));
});

describe('apiClinicExercisesRepository — seleção de vídeo', () => {
    it('prefere vídeo com status completed em relação a outros', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([
                makeApiExercise({
                    videos: [
                        makeVideo({
                            id: 1,
                            cdn_url: null,
                            url: 'url-processing',
                            thumbnail_url: 'thumb1',
                            status: 'processing',
                        }),
                        makeVideo({
                            id: 2,
                            cdn_url: 'cdn-completed',
                            thumbnail_url: 'thumb2',
                            status: 'completed',
                        }),
                    ],
                }),
            ]),
        );
        const [ex] = await apiClinicExercisesRepository.list();
        expect(ex.videoUrl).toBe('cdn-completed');
        expect(ex.thumbnailUrl).toBe('thumb2');
    });

    it('cai para o primeiro vídeo quando nenhum está completed', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([
                makeApiExercise({
                    videos: [
                        makeVideo({
                            id: 1,
                            url: 'url-first',
                            cdn_url: null,
                            status: 'processing',
                        }),
                        makeVideo({
                            id: 2,
                            url: 'url-second',
                            cdn_url: null,
                            status: 'processing',
                        }),
                    ],
                }),
            ]),
        );
        const [ex] = await apiClinicExercisesRepository.list();
        expect(ex.videoUrl).toBe('url-first');
    });

    it('prefere cdn_url sobre url para o videoUrl', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([
                makeApiExercise({
                    videos: [
                        makeVideo({
                            url: 'storage-url',
                            cdn_url: 'cdn-url',
                            status: 'completed',
                        }),
                    ],
                }),
            ]),
        );
        const [ex] = await apiClinicExercisesRepository.list();
        expect(ex.videoUrl).toBe('cdn-url');
    });

    it('usa url como fallback quando cdn_url é null', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([
                makeApiExercise({
                    videos: [
                        makeVideo({
                            url: 'storage-url',
                            cdn_url: null,
                            status: 'completed',
                        }),
                    ],
                }),
            ]),
        );
        const [ex] = await apiClinicExercisesRepository.list();
        expect(ex.videoUrl).toBe('storage-url');
    });

    it('retorna strings vazias e duration 0 quando não há vídeos', async () => {
        mockGet.mockResolvedValueOnce(
            makePaginatorResponse([makeApiExercise({ videos: [] })]),
        );
        const [ex] = await apiClinicExercisesRepository.list();
        expect(ex.videoUrl).toBe('');
        expect(ex.thumbnailUrl).toBe('');
        expect(ex.duration).toBe(0);
    });
});

describe('apiClinicExercisesRepository.toggleFavorite', () => {
    it('envia POST para a rota correta', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: { exercise_id: 5, is_favorite: true } },
        });
        await apiClinicExercisesRepository.toggleFavorite('5');
        expect(mockPost).toHaveBeenCalledWith('/clinic/exercises/5/favorite');
    });

    it('retorna isFavorite true quando API retorna true', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: { exercise_id: 1, is_favorite: true } },
        });
        const result = await apiClinicExercisesRepository.toggleFavorite('1');
        expect(result.isFavorite).toBe(true);
    });

    it('retorna isFavorite false quando API retorna false', async () => {
        mockPost.mockResolvedValueOnce({
            data: { data: { exercise_id: 1, is_favorite: false } },
        });
        const result = await apiClinicExercisesRepository.toggleFavorite('1');
        expect(result.isFavorite).toBe(false);
    });

    it('propaga erro quando a requisição falha', async () => {
        mockPost.mockRejectedValueOnce(new Error('Network Error'));
        await expect(
            apiClinicExercisesRepository.toggleFavorite('1'),
        ).rejects.toThrow('Network Error');
    });
});

describe('apiClinicExercisesRepository.getById', () => {
    it('retorna o exercício correto pelo id', async () => {
        mockGet.mockResolvedValueOnce({
            data: { data: makeApiExercise({ id: 7, name: 'Ponte Glútea' }) },
        });
        const ex = await apiClinicExercisesRepository.getById('7');
        expect(ex?.title).toBe('Ponte Glútea');
    });

    it('retorna null quando a resposta não tem dados', async () => {
        mockGet.mockResolvedValueOnce({ data: {} });
        const ex = await apiClinicExercisesRepository.getById('999');
        expect(ex).toBeNull();
    });
});
