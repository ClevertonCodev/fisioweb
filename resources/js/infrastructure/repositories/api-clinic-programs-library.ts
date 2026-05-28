import type { AdminProgram, AdminProgramGroup } from '@/domain/admin';
import { apiClient } from '@/infrastructure/api/client';

interface ApiVideo {
    thumbnail_url?: string | null;
    cdn_url?: string | null;
    url?: string | null;
}

interface ApiExercise {
    id: number;
    name: string;
    videos?: ApiVideo[];
}

interface ApiProgramExercise {
    id: number;
    exercise_id: number;
    admin_program_group_id: number | null;
    days_of_week: number[] | null;
    period: 'morning' | 'afternoon' | 'night' | null;
    sets_min: number | null;
    sets_max: number | null;
    repetitions_min: number | null;
    repetitions_max: number | null;
    load_min: number | null;
    load_max: number | null;
    rest_time: number | null;
    notes: string | null;
    sort_order: number;
    exercise?: ApiExercise;
}

interface ApiProgramGroup {
    id: number;
    admin_program_id: number;
    name: string;
    sort_order: number;
    exercises?: ApiProgramExercise[];
}

interface ApiSharedProgram {
    id: number;
    title: string;
    description: string | null;
    physio_area_id: number | null;
    physio_subarea_id: number | null;
    duration_minutes: number | null;
    is_active: boolean;
    exercises_count?: number;
    physio_area?: { id: number; name: string } | null;
    created_by?: { id: number; name: string };
    groups?: ApiProgramGroup[];
}

function mapExercise(raw: ApiProgramExercise) {
    const video = raw.exercise?.videos?.[0];
    return {
        id: raw.id,
        exerciseId: raw.exercise_id,
        adminProgramGroupId: raw.admin_program_group_id,
        daysOfWeek: raw.days_of_week,
        period: raw.period,
        setsMin: raw.sets_min,
        setsMax: raw.sets_max,
        repetitionsMin: raw.repetitions_min,
        repetitionsMax: raw.repetitions_max,
        loadMin: raw.load_min,
        loadMax: raw.load_max,
        restTime: raw.rest_time,
        notes: raw.notes,
        sortOrder: raw.sort_order,
        exercise: raw.exercise
            ? {
                  id: raw.exercise.id,
                  name: raw.exercise.name,
                  thumbnailUrl: video?.thumbnail_url ?? null,
                  videoUrl: video?.cdn_url ?? video?.url ?? null,
              }
            : undefined,
    };
}

function mapGroup(raw: ApiProgramGroup): AdminProgramGroup {
    return {
        id: raw.id,
        adminProgramId: raw.admin_program_id,
        name: raw.name,
        sortOrder: raw.sort_order,
        exercises: raw.exercises?.map(mapExercise),
    };
}

export type SharedProgram = AdminProgram & { exercisesCount: number };

function mapProgram(raw: ApiSharedProgram): SharedProgram {
    return {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        physioAreaId: raw.physio_area_id,
        physioSubareaId: raw.physio_subarea_id,
        durationMinutes: raw.duration_minutes,
        isActive: Boolean(raw.is_active),
        physioArea: raw.physio_area ?? null,
        createdBy: raw.created_by,
        groups: raw.groups?.map(mapGroup),
        exercisesCount: raw.exercises_count ?? 0,
    };
}

export interface ClinicProgramsLibraryParams {
    search?: string;
    physioAreaId?: number | null;
    page?: number;
    perPage?: number;
}

export interface ClinicProgramsLibraryResult {
    data: SharedProgram[];
    meta: { currentPage: number; lastPage: number; total: number };
}

export const apiClinicProgramsLibraryRepository = {
    async list(params: ClinicProgramsLibraryParams = {}): Promise<ClinicProgramsLibraryResult> {
        const { data } = await apiClient.get<{
            current_page: number;
            data: ApiSharedProgram[];
            last_page: number;
            total: number;
        }>('/clinic/programs', {
            params: {
                per_page: params.perPage ?? 20,
                page: params.page ?? 1,
                search: params.search || undefined,
                physio_area_id: params.physioAreaId || undefined,
            },
        });
        return {
            data: (data.data ?? []).map(mapProgram),
            meta: {
                currentPage: data.current_page,
                lastPage: data.last_page,
                total: data.total,
            },
        };
    },

    async getDetail(id: number): Promise<SharedProgram> {
        const { data } = await apiClient.get<{ data: ApiSharedProgram }>(`/clinic/programs/${id}`);
        return mapProgram(data.data);
    },
};
