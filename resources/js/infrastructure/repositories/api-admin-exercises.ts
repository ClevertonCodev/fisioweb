import type {
    AdminExercise,
    AdminExerciseOptions,
    AdminExercisesRepository,
} from '@/application/admin/ports';
import { apiClient } from '@/infrastructure/api/client';

function mapApiExercise(raw: Record<string, unknown>): AdminExercise {
    return {
        id: raw.id as number,
        name: raw.name as string,
        physio_area_id: raw.physio_area_id as number,
        physio_subarea_id: (raw.physio_subarea_id as number) ?? null,
        body_region_id: raw.body_region_id as number,
        therapeutic_goal: (raw.therapeutic_goal as string) ?? null,
        description: (raw.description as string) ?? null,
        audio_description: (raw.audio_description as string) ?? null,
        difficulty_level: raw.difficulty_level as string,
        muscle_group: (raw.muscle_group as string) ?? null,
        movement_type: (raw.movement_type as string) ?? null,
        movement_form: (raw.movement_form as string) ?? null,
        kinetic_chain: (raw.kinetic_chain as string) ?? null,
        decubitus: (raw.decubitus as string) ?? null,
        indications: (raw.indications as string) ?? null,
        contraindications: (raw.contraindications as string) ?? null,
        frequency: (raw.frequency as string) ?? null,
        sets: (raw.sets as number) ?? null,
        repetitions: (raw.repetitions as number) ?? null,
        rest_time: (raw.rest_time as number) ?? null,
        clinical_notes: (raw.clinical_notes as string) ?? null,
        is_active: Boolean(raw.is_active ?? true),
        created_at: raw.created_at as string,
        updated_at: raw.updated_at as string,
        physio_area: raw.physio_area as { id: number; name: string } | undefined,
        physio_subarea: raw.physio_subarea as { id: number; name: string } | null | undefined,
        body_region: raw.body_region as { id: number; name: string } | undefined,
        videos: (raw.videos as unknown[]) ?? [],
    };
}

export const apiAdminExercisesRepository: AdminExercisesRepository = {
    async list(params = {}) {
        const { data } = await apiClient.get<{
            data: {
                data?: unknown[];
                current_page?: number;
                last_page?: number;
                total?: number;
            };
        }>('/admin/exercises', {
            params: {
                per_page: params.per_page ?? 15,
                page: params.page ?? 1,
                search: params.search,
                physio_area_id: params.physio_area_id,
                physio_subarea_id: params.physio_subarea_id,
                body_region_id: params.body_region_id,
                difficulty_level: params.difficulty_level,
                movement_form: params.movement_form,
                is_active: params.is_active,
            },
        });
        // Backend returns { data: paginator }; paginator has { data: items[], current_page, last_page, total }
        const paginator = data?.data as {
            data?: unknown[];
            current_page?: number;
            last_page?: number;
            total?: number;
        };
        const items = Array.isArray(paginator?.data) ? paginator.data : [];
        return {
            data: items.map((e) => mapApiExercise(e as Record<string, unknown>)),
            meta: {
                currentPage: paginator?.current_page ?? 1,
                lastPage: paginator?.last_page ?? 1,
                total: paginator?.total ?? 0,
            },
        };
    },

    async getById(id) {
        const { data } = await apiClient.get<{ data: unknown }>(`/admin/exercises/${id}`);
        if (!data?.data) return null;
        return mapApiExercise((data as { data: Record<string, unknown> }).data);
    },

    async getOptions() {
        const { data } = await apiClient.get<{ data: Record<string, unknown> }>(
            '/admin/exercises/options',
        );
        const d = (data as { data?: Record<string, unknown> })?.data ?? {};
        return {
            physio_areas: (d.physio_areas as AdminExerciseOptions['physio_areas']) ?? [],
            body_regions: (d.body_regions as AdminExerciseOptions['body_regions']) ?? [],
            difficulties: (d.difficulties as Record<string, string>) ?? {},
            movement_forms: (d.movement_forms as Record<string, string>) ?? {},
            videos: (d.videos as unknown[]) ?? [],
        };
    },

    async create(payload) {
        const { data } = await apiClient.post<{ data: unknown }>('/admin/exercises', payload);
        return mapApiExercise((data as { data: Record<string, unknown> }).data);
    },

    async update(id, payload) {
        const { data } = await apiClient.put<{ data: unknown }>(`/admin/exercises/${id}`, payload);
        return mapApiExercise((data as { data: Record<string, unknown> }).data);
    },

    async destroy(id) {
        await apiClient.delete(`/admin/exercises/${id}`);
    },
};
