import type {
    ExerciseListParams,
    ExerciseListResult,
    ExercisesRepository,
} from '@/application/clinic/ports';
import type { Exercise, ExerciseDifficulty } from '@/domain/clinic';
import { apiClient } from '@/infrastructure/api/client';

interface ApiVideo {
    id: number;
    url: string | null;
    cdn_url: string | null;
    thumbnail_url: string | null;
    duration: number | null;
    status: string;
}

interface ApiRelation {
    name: string;
}

interface ApiExercise {
    id: number;
    name: string;
    physio_area: ApiRelation | null;
    physio_subarea: ApiRelation | null;
    body_region: ApiRelation | null;
    therapeutic_goal: string | null;
    difficulty_level: 'easy' | 'medium' | 'hard' | null;
    muscle_group: string | null;
    movement_type: string | null;
    movement_form: string | null;
    kinetic_chain: string | null;
    is_favorite: boolean;
    videos: ApiVideo[];
    created_at: string;
}

interface ApiPaginator {
    data: ApiExercise[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const difficultyMap: Record<string, ExerciseDifficulty> = {
    easy: 'facil',
    medium: 'medio',
    hard: 'dificil',
};

function toEntity(raw: ApiExercise): Exercise {
    const video = raw.videos.find((v) => v.status === 'completed') ?? raw.videos[0] ?? null;

    return {
        id: String(raw.id),
        title: raw.name ?? '',
        thumbnailUrl: video?.thumbnail_url ?? '',
        videoUrl: video?.cdn_url ?? video?.url ?? '',
        specialty: raw.physio_area?.name ?? '',
        bodyArea: raw.physio_subarea?.name ?? '',
        bodyRegion: raw.body_region?.name ?? '',
        objective: raw.therapeutic_goal ?? '',
        difficulty: difficultyMap[raw.difficulty_level ?? ''] ?? 'facil',
        muscleGroup: raw.muscle_group ?? '',
        equipment: '',
        movementType: raw.movement_type ?? '',
        movementPattern: raw.kinetic_chain ?? '',
        movementForm: raw.movement_form ?? '',
        duration: video?.duration ?? 0,
        isFavorite: raw.is_favorite ?? false,
        createdAt: raw.created_at ?? '',
    };
}

export const apiClinicExercisesRepository: ExercisesRepository = {
    async list() {
        const { data } = await apiClient.get<{ data: ApiPaginator }>('/clinic/exercises', {
            params: { per_page: 200 },
        });
        const items = data?.data?.data ?? [];
        return items.map(toEntity);
    },

    async listPaginated(params?: ExerciseListParams): Promise<ExerciseListResult> {
        const { data } = await apiClient.get<{ data: ApiPaginator }>('/clinic/exercises', {
            params: {
                page: params?.page ?? 1,
                per_page: params?.perPage ?? 20,
            },
        });
        return {
            items: (data?.data?.data ?? []).map(toEntity),
            total: data?.data?.total ?? 0,
            lastPage: data?.data?.last_page ?? 1,
            perPage: data?.data?.per_page ?? 20,
            currentPage: data?.data?.current_page ?? 1,
        };
    },

    async getById(id) {
        const { data } = await apiClient.get<{ data: ApiExercise }>(`/clinic/exercises/${id}`);
        if (!data?.data) return null;
        return toEntity(data.data);
    },

    async getFilterCategories() {
        return [];
    },

    async toggleFavorite(id) {
        const { data } = await apiClient.post<{
            data: { exercise_id: number; is_favorite: boolean };
        }>(`/clinic/exercises/${id}/favorite`);
        return { isFavorite: data.data.is_favorite };
    },
};
