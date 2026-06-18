import type {
    AdminProgramsRepository,
    AdminProgramWriteDto,
} from '@/application/admin/ports';
import type {
    AdminProgram,
    AdminProgramExercise,
    AdminProgramGroup,
} from '@/domain/admin';
import { apiClient } from '@/infrastructure/api/client';

interface ApiExercise {
    id: number;
    name: string;
    videos?: {
        thumbnail_url?: string | null;
        cdn_url?: string | null;
        url?: string | null;
    }[];
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

interface ApiProgram {
    id: number;
    title: string;
    description: string | null;
    physio_area_id: number | null;
    physio_subarea_id: number | null;
    duration_minutes: number | null;
    is_active: boolean;
    created_by?: { id: number; name: string };
    physio_area?: { id: number; name: string } | null;
    groups?: ApiProgramGroup[];
}

function mapExercise(raw: ApiProgramExercise): AdminProgramExercise {
    const ex = raw.exercise;
    const video = ex?.videos?.[0];
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
        exercise: ex
            ? {
                  id: ex.id,
                  name: ex.name,
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

function mapProgram(raw: ApiProgram): AdminProgram {
    return {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        physioAreaId: raw.physio_area_id,
        physioSubareaId: raw.physio_subarea_id,
        durationMinutes: raw.duration_minutes,
        isActive: Boolean(raw.is_active),
        createdBy: raw.created_by,
        physioArea: raw.physio_area,
        groups: raw.groups?.map(mapGroup),
    };
}

function toApiPayload(
    dto: AdminProgramWriteDto | Partial<AdminProgramWriteDto>,
) {
    return {
        title: dto.title,
        description: dto.description,
        physio_area_id: dto.physioAreaId,
        physio_subarea_id: dto.physioSubareaId,
        duration_minutes: dto.durationMinutes,
        is_active: dto.isActive,
        groups: dto.groups?.map((g, i) => ({
            name: g.name,
            sort_order: g.sortOrder ?? i,
        })),
        exercises: dto.exercises?.map((e, i) => ({
            exercise_id: e.exerciseId,
            group_index: e.groupIndex,
            days_of_week: e.daysOfWeek,
            period: e.period,
            sets_min: e.setsMin,
            sets_max: e.setsMax,
            repetitions_min: e.repetitionsMin,
            repetitions_max: e.repetitionsMax,
            load_min: e.loadMin,
            load_max: e.loadMax,
            rest_time: e.restTime,
            notes: e.notes,
            sort_order: e.sortOrder ?? i,
        })),
    };
}

export const apiAdminProgramsRepository: AdminProgramsRepository = {
    async list(params = {}) {
        const { data } = await apiClient.get<{
            current_page: number;
            data: ApiProgram[];
            last_page: number;
            total: number;
        }>('/admin/programs', {
            params: {
                per_page: params.perPage ?? 15,
                page: params.page ?? 1,
                search: params.search,
                physio_area_id: params.physioAreaId,
                is_active: params.isActive,
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

    async getById(id) {
        const { data } = await apiClient.get<{ data: ApiProgram }>(
            `/admin/programs/${id}`,
        );
        return mapProgram(data.data);
    },

    async getDetail(id) {
        const { data } = await apiClient.get<{ data: ApiProgram }>(
            `/admin/programs/${id}/detail`,
        );
        return mapProgram(data.data);
    },

    async create(dto) {
        const { data } = await apiClient.post<{ data: ApiProgram }>(
            '/admin/programs',
            toApiPayload(dto),
        );
        return mapProgram(data.data);
    },

    async update(id, dto) {
        const { data } = await apiClient.put<{ data: ApiProgram }>(
            `/admin/programs/${id}`,
            toApiPayload(dto),
        );
        return mapProgram(data.data);
    },

    async destroy(id) {
        await apiClient.delete(`/admin/programs/${id}`);
    },
};
