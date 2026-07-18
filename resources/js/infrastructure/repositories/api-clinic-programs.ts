import type {
    ProgramListParams,
    ProgramListResult,
    ProgramWriteDto,
    ProgramsRepository,
} from '@/application/clinic/ports';
import type { Program, ProgramExercise, ProgramGroup } from '@/domain/clinic';
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

interface ApiTreatmentPlanExercise {
    id: number;
    exercise_id: number;
    treatment_plan_group_id: number | null;
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

interface ApiTreatmentPlanGroup {
    id: number;
    name: string;
    sort_order: number;
    exercises?: ApiTreatmentPlanExercise[];
}

interface ApiTreatmentPlan {
    id: number;
    title: string;
    patient_id: number | null;
    patient?: {
        id: number;
        name: string;
        photo_url?: string | null;
        phone?: string | null;
        email?: string | null;
    } | null;
    clinic_user?: {
        id: number;
        name: string;
        photo_url?: string | null;
    } | null;
    message: string | null;
    start_date: string | null;
    end_date: string | null;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    patient_viewed_at: string | null;
    patient_completed_count: number;
    exercises_count?: number;
    groups?: ApiTreatmentPlanGroup[];
    share_url?: string | null;
    created_at: string;
}

const periodToDomain: Record<string, ProgramExercise['period']> = {
    morning: 'manha',
    afternoon: 'tarde',
    night: 'noite',
};

const periodToApi: Record<string, 'morning' | 'afternoon' | 'night'> = {
    manha: 'morning',
    tarde: 'afternoon',
    noite: 'night',
};

function mapPlanExercise(raw: ApiTreatmentPlanExercise): ProgramExercise {
    const video = raw.exercise?.videos?.[0];
    return {
        id: String(raw.id),
        exerciseId: String(raw.exercise_id),
        title: raw.exercise?.name ?? '',
        thumbnailUrl: video?.thumbnail_url ?? '',
        videoUrl: video?.cdn_url ?? video?.url ?? '',
        days: raw.days_of_week ?? [],
        period: raw.period ? (periodToDomain[raw.period] ?? null) : null,
        seriesMin: raw.sets_min,
        seriesMax: raw.sets_max,
        repetitionsMin: raw.repetitions_min,
        repetitionsMax: raw.repetitions_max,
        loadMin: raw.load_min,
        loadMax: raw.load_max,
        restTime: raw.rest_time,
        notes: raw.notes,
        isConfigured: true,
    };
}

function mapGroup(raw: ApiTreatmentPlanGroup): ProgramGroup {
    return {
        id: String(raw.id),
        name: raw.name,
        exercises: (raw.exercises ?? []).map(mapPlanExercise),
    };
}

function toEntity(raw: ApiTreatmentPlan): Program {
    const groups = (raw.groups ?? []).map(mapGroup);
    const exerciseCount =
        raw.exercises_count ??
        groups.reduce((sum, g) => sum + g.exercises.length, 0);
    return {
        id: String(raw.id),
        title: raw.title,
        patientId: raw.patient_id ? String(raw.patient_id) : null,
        patientName: raw.patient?.name ?? null,
        patientPhotoUrl: raw.patient?.photo_url ?? null,
        patientPhone: raw.patient?.phone ?? null,
        patientEmail: raw.patient?.email ?? null,
        shareUrl: raw.share_url ?? null,
        professionalId: raw.clinic_user?.id ? String(raw.clinic_user.id) : null,
        professionalName: raw.clinic_user?.name ?? null,
        professionalPhotoUrl: raw.clinic_user?.photo_url ?? null,
        exerciseCount,
        startDate: raw.start_date ?? '',
        endDate: raw.end_date ?? null,
        message: raw.message ?? '',
        groups,
        status: raw.status === 'cancelled' ? 'completed' : raw.status,
        patientViewedAt: raw.patient_viewed_at ?? null,
        patientCompletedCount: raw.patient_completed_count ?? 0,
        createdAt: raw.created_at,
    };
}

function toApiPayload(dto: ProgramWriteDto) {
    return {
        title: dto.title,
        patient_id: dto.patientId ?? undefined,
        message: dto.message || undefined,
        start_date: dto.startDate || undefined,
        end_date: dto.endDate || undefined,
        status: dto.status ?? undefined,
        groups: dto.groups.map((g, i) => ({
            name: g.name,
            sort_order: g.sortOrder ?? i,
        })),
        exercises: dto.exercises.map((e, i) => ({
            exercise_id: e.exerciseId,
            group_index: e.groupIndex,
            days_of_week: e.days.length > 0 ? e.days : null,
            period: e.period ? (periodToApi[e.period] ?? null) : null,
            sets_min: e.setsMin,
            sets_max: e.setsMax,
            repetitions_min: e.repetitionsMin,
            repetitions_max: e.repetitionsMax,
            load_min: e.loadMin,
            load_max: e.loadMax,
            rest_time:
                e.restTime !== null && e.restTime !== undefined
                    ? String(e.restTime)
                    : null,
            notes: e.notes,
            sort_order: i,
        })),
    };
}

export const apiClinicProgramsRepository: ProgramsRepository = {
    async list(params?: ProgramListParams): Promise<ProgramListResult> {
        const { data } = await apiClient.get<{
            data: {
                data?: ApiTreatmentPlan[];
                total: number;
                last_page: number;
                per_page: number;
                current_page: number;
            };
        }>('/clinic/treatment-plans', {
            params: {
                page: params?.page ?? 1,
                per_page: params?.perPage ?? 10,
                ...(params?.search ? { search: params.search } : {}),
                ...(params?.status ? { status: params.status } : {}),
                ...(params?.withoutPatient ? { without_patient: 1 } : {}),
            },
        });
        return {
            items: Array.isArray(data?.data?.data)
                ? data.data.data.map(toEntity)
                : [],
            total: data?.data?.total ?? 0,
            lastPage: data?.data?.last_page ?? 1,
            perPage: data?.data?.per_page ?? 10,
            currentPage: data?.data?.current_page ?? 1,
        };
    },

    async getById(id) {
        const { data } = await apiClient.get<{ data: ApiTreatmentPlan }>(
            `/clinic/treatment-plans/${id}`,
        );
        if (!data?.data) return null;
        return toEntity(data.data);
    },

    async create(dto) {
        const { data } = await apiClient.post<{ data: ApiTreatmentPlan }>(
            '/clinic/treatment-plans',
            toApiPayload(dto),
        );
        return toEntity(data.data);
    },

    async duplicate(id) {
        const { data } = await apiClient.post<{ data: ApiTreatmentPlan }>(
            `/clinic/treatment-plans/${id}/duplicate`,
        );
        return toEntity(data.data);
    },

    async toModel(id) {
        const { data } = await apiClient.post<{ data: ApiTreatmentPlan }>(
            `/clinic/treatment-plans/${id}/to-model`,
        );
        return toEntity(data.data);
    },

    async update(id, dto) {
        const { data } = await apiClient.put<{ data: ApiTreatmentPlan }>(
            `/clinic/treatment-plans/${id}`,
            toApiPayload(dto),
        );
        return toEntity(data.data);
    },

    async destroy(id) {
        await apiClient.delete(`/clinic/treatment-plans/${id}`);
    },

    async fetchPdfBlob(id) {
        const res = await apiClient.get<Blob>(
            `/clinic/treatment-plans/${id}/pdf`,
            { responseType: 'blob' },
        );
        return res.data;
    },
};
