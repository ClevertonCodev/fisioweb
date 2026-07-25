import type {
    ExercisePrescription,
    PatientExercise,
    PatientProgram,
    PatientProgramGroup,
} from '@/domain/patient/program';
import { apiClient } from '@/infrastructure/api/client';

interface ApiPrescription {
    series_min?: number | null;
    series_max?: number | null;
    repetitions_min?: number | null;
    repetitions_max?: number | null;
    load_min?: number | null;
    load_max?: number | null;
    rest_time?: number | null;
    intensity?: string | null;
    duration_min?: number | null;
    duration_max?: number | null;
    maintain_for?: number | null;
}

interface ApiExercise {
    id: number | string;
    name: string;
    video_url?: string | null;
    thumbnail_url?: string | null;
    notes?: string | null;
    days?: Array<string | number> | null;
    period?: string[] | string | null;
    prescription?: ApiPrescription | null;
}

interface ApiGroup {
    id: number | string;
    name: string;
    exercises: ApiExercise[];
}

interface ApiProgram {
    public_token: string;
    name: string;
    professional_name: string;
    professional_photo_url?: string | null;
    professional_registration?: string | null;
    clinic_name?: string | null;
    clinic_slug?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    status: PatientProgram['status'];
    message?: string | null;
    exercise_count?: number;
    outcome_pain_enabled?: boolean;
    outcome_difficulty_enabled?: boolean;
    outcome_satisfaction_enabled?: boolean;
    groups?: ApiGroup[];
    current_execution?: {
        id: number;
        unfinished_exercise_ids?: Array<number | string>;
        last_loads?: Record<string, unknown>;
    } | null;
}

interface ApiEnvelope<T> {
    data: T;
}

const DAY_LABELS: Record<number, string> = {
    0: 'Domingo',
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
    6: 'Sábado',
    7: 'Domingo',
};

const PERIOD_LABELS: Record<string, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    night: 'Noite',
    manha: 'Manhã',
    tarde: 'Tarde',
    noite: 'Noite',
    Manhã: 'Manhã',
    Tarde: 'Tarde',
    Noite: 'Noite',
};

const STAR_TO_RATING: Record<number, string> = {
    1: 'Péssimo',
    2: 'Ruim',
    3: 'Médio',
    4: 'Bom',
    5: 'Ótimo',
};

function mapDays(days?: Array<string | number> | null): string[] {
    if (!days?.length) return [];
    return days.map((d) => {
        if (typeof d === 'number') return DAY_LABELS[d] ?? String(d);
        return d;
    });
}

function mapPeriod(period?: string[] | string | null): string[] {
    if (!period) return [];
    const list = Array.isArray(period) ? period : [period];
    return list.map((p) => PERIOD_LABELS[p] ?? p);
}

function mapPrescription(raw?: ApiPrescription | null): ExercisePrescription {
    if (!raw) return {};
    return {
        seriesMin: raw.series_min ?? undefined,
        seriesMax: raw.series_max ?? undefined,
        repetitionsMin: raw.repetitions_min ?? undefined,
        repetitionsMax: raw.repetitions_max ?? undefined,
        loadMin: raw.load_min ?? undefined,
        loadMax: raw.load_max ?? undefined,
        restTime: raw.rest_time ?? undefined,
        intensity: (raw.intensity as ExercisePrescription['intensity']) ?? undefined,
        durationMin: raw.duration_min ?? undefined,
        durationMax: raw.duration_max ?? undefined,
        maintainFor: raw.maintain_for ?? undefined,
    };
}

function mapExercise(raw: ApiExercise): PatientExercise {
    return {
        id: String(raw.id),
        name: raw.name,
        videoUrl: raw.video_url ?? undefined,
        thumbnailUrl: raw.thumbnail_url ?? undefined,
        notes: raw.notes ?? undefined,
        days: mapDays(raw.days),
        period: mapPeriod(raw.period),
        prescription: mapPrescription(raw.prescription),
    };
}

function mapGroup(raw: ApiGroup): PatientProgramGroup {
    return {
        id: String(raw.id),
        name: raw.name,
        exercises: (raw.exercises ?? []).map(mapExercise),
    };
}

function mapProgram(raw: ApiProgram): PatientProgram {
    const groups = (raw.groups ?? []).map(mapGroup);
    const exerciseCount =
        raw.exercise_count ??
        groups.reduce((sum, g) => sum + g.exercises.length, 0);

    return {
        publicToken: raw.public_token,
        name: raw.name,
        professionalName: raw.professional_name,
        professionalPhotoUrl: raw.professional_photo_url ?? undefined,
        professionalRegistration: raw.professional_registration ?? undefined,
        clinicName: raw.clinic_name ?? undefined,
        clinicSlug: raw.clinic_slug ?? undefined,
        startDate: raw.start_date ?? '',
        endDate: raw.end_date ?? '',
        status: raw.status,
        message: raw.message ?? undefined,
        groups,
        exerciseCount,
        outcomePainEnabled: raw.outcome_pain_enabled ?? true,
        outcomeDifficultyEnabled: raw.outcome_difficulty_enabled ?? true,
        outcomeSatisfactionEnabled: raw.outcome_satisfaction_enabled ?? true,
        currentExecutionId: raw.current_execution?.id
            ? String(raw.current_execution.id)
            : null,
    };
}

export async function listPatientPrograms(): Promise<PatientProgram[]> {
    const { data } = await apiClient.get<ApiEnvelope<ApiProgram[]>>(
        '/patient/programs',
    );
    return (data.data ?? []).map(mapProgram);
}

export async function getPatientProgramByPublicToken(
    publicToken: string,
): Promise<PatientProgram> {
    const { data } = await apiClient.get<ApiEnvelope<ApiProgram>>(
        `/patient/programs/${publicToken}`,
    );
    return mapProgram(data.data);
}

export async function registerPatientProgramView(
    publicToken: string,
): Promise<void> {
    await apiClient.post(`/patient/programs/${publicToken}/view`);
}

export async function startOrResumePatientProgramExecution(
    publicToken: string,
): Promise<{ id: string; resumed: boolean }> {
    const { data } = await apiClient.post<
        ApiEnvelope<{ id: number; resumed?: boolean }>
    >(`/patient/programs/${publicToken}/executions`);
    return {
        id: String(data.data.id),
        resumed: Boolean(data.data.resumed),
    };
}

export async function savePatientProgramSeries(input: {
    publicToken: string;
    executionId: string;
    exerciseId: string;
    series: Array<{
        count?: number;
        weightValue?: string;
        weightUnit?: string;
        isBodyweight?: boolean;
    }>;
}): Promise<void> {
    await apiClient.post(
        `/patient/programs/${input.publicToken}/executions/${input.executionId}/series`,
        {
            exercise_id: Number(input.exerciseId) || input.exerciseId,
            series: input.series.map((s) => ({
                count: s.count,
                weight_value: s.weightValue,
                weight_unit: s.weightUnit ?? 'kg',
                is_bodyweight: s.isBodyweight ?? false,
            })),
        },
    );
}

export async function updateUnfinishedExercises(input: {
    publicToken: string;
    executionId: string;
    unfinishedExerciseIds: string[];
}): Promise<void> {
    await apiClient.patch(
        `/patient/programs/${input.publicToken}/executions/${input.executionId}`,
        {
            unfinished_exercise_ids: input.unfinishedExerciseIds.map(
                (id) => Number(id) || id,
            ),
        },
    );
}

export async function submitPatientProgramFeedback(input: {
    publicToken: string;
    executionId?: string | null;
    pain?: number;
    painNotes?: string;
    difficulty?: number;
    difficultyNotes?: string;
    ratingStars?: number;
    ratingNotes?: string;
    outcomePainEnabled: boolean;
    outcomeDifficultyEnabled: boolean;
    outcomeSatisfactionEnabled: boolean;
}): Promise<void> {
    const body: Record<string, unknown> = {};
    if (input.executionId) {
        body.execution_id = Number(input.executionId) || input.executionId;
    }
    if (input.outcomePainEnabled) {
        body.pain = input.pain ?? 0;
        if (input.painNotes) body.pain_notes = input.painNotes;
    }
    if (input.outcomeDifficultyEnabled) {
        body.difficulty = input.difficulty ?? 0;
        if (input.difficultyNotes) body.difficulty_notes = input.difficultyNotes;
    }
    if (input.outcomeSatisfactionEnabled) {
        const stars = input.ratingStars ?? 0;
        body.rating = STAR_TO_RATING[stars] ?? 'Médio';
        if (input.ratingNotes) body.rating_notes = input.ratingNotes;
    }
    await apiClient.post(`/patient/programs/${input.publicToken}/feedback`, body);
}

export async function completePatientProgram(
    publicToken: string,
): Promise<void> {
    await apiClient.post(`/patient/programs/${publicToken}/complete`);
}
