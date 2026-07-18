/** Portas (interfaces) do contexto admin */
import type {
    AdminProgram,
    Clinic,
    Feature,
    FeaturePlan,
    Plan,
} from '@/domain/admin';

export interface LoginAsClinicResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: { id: number; name: string; email: string };
}

/** DTO de escrita para criar/atualizar Clínica (application concern, camelCase) */
export interface ClinicWriteDto {
    name: string;
    typePerson: 'PF' | 'PJ';
    document: string;
    email: string;
    phone?: string | null;
    status: number;
    slug?: string | null;
    planId?: number | null;
    zipCode?: string | null;
    address?: string | null;
    number?: string | null;
    city?: string | null;
    state?: string | null;
}

export interface ClinicsRepository {
    list(params?: {
        search?: string;
        plan_id?: number;
        status?: number;
        per_page?: number;
        page?: number;
    }): Promise<Clinic[]>;
    getById(id: number): Promise<Clinic | null>;
    getPlansOptions(): Promise<{ id: number; name: string }[]>;
    create(data: ClinicWriteDto): Promise<Clinic>;
    update(id: number, data: Omit<ClinicWriteDto, 'password'>): Promise<Clinic>;
    destroy(id: number): Promise<void>;
    reactivate(id: number): Promise<Clinic>;
    loginAs(id: number): Promise<LoginAsClinicResponse>;
}

/** DTO de escrita para criar/atualizar Plano (application concern, camelCase) */
export interface PlanWriteDto {
    name: string;
    billingType: 'fixed' | 'per_user';
    monthlyValue: number;
    annualValue: number;
}

/** DTO de escrita para vincular funcionalidade a plano (application concern, camelCase) */
export interface FeaturePlanWriteDto {
    planId: number;
    featureId: number;
    value: boolean;
}

export interface PlansRepository {
    list(params?: {
        search?: string;
        per_page?: number;
        page?: number;
    }): Promise<Plan[]>;
    getById(id: number): Promise<Plan | null>;
    getFeaturePlans(params?: { plan_id?: number }): Promise<FeaturePlan[]>;
    create(data: PlanWriteDto): Promise<Plan>;
    update(id: number, data: PlanWriteDto): Promise<Plan>;
    destroy(id: number): Promise<void>;
    createFeaturePlan(data: FeaturePlanWriteDto): Promise<FeaturePlan>;
    destroyFeaturePlan(id: number): Promise<void>;
}

export interface FeatureCreateOptions {
    allowed_keys: Record<string, string>;
    available_keys: Record<string, string>;
    types: Record<string, string>;
}

/** DTO de escrita para criar/atualizar Feature (application concern, camelCase) */
export interface FeatureWriteDto {
    key: string;
    name: string;
    valueIsolated: number | null;
    type: string;
}

export interface FeaturesRepository {
    getCreateOptions(): Promise<FeatureCreateOptions>;
    list(params?: {
        search?: string;
        type?: string;
        per_page?: number;
        page?: number;
    }): Promise<Feature[]>;
    getById(id: number): Promise<Feature | null>;
    create(data: FeatureWriteDto): Promise<Feature>;
    update(id: number, data: FeatureWriteDto): Promise<Feature>;
    destroy(id: number): Promise<void>;
}

/** Exercícios (admin) - CRUD */
export interface AdminExercise {
    id: number;
    name: string;
    physio_area_id: number;
    physio_subarea_id: number | null;
    body_region_id: number;
    therapeutic_goal: string | null;
    description: string | null;
    audio_description: string | null;
    difficulty_level: string;
    muscle_group: string | null;
    movement_type: string | null;
    movement_form: string | null;
    kinetic_chain: string | null;
    decubitus: string | null;
    indications: string | null;
    contraindications: string | null;
    frequency: string | null;
    sets: number | null;
    repetitions: number | null;
    rest_time: number | null;
    clinical_notes: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    physio_area?: { id: number; name: string };
    physio_subarea?: { id: number; name: string } | null;
    body_region?: { id: number; name: string };
    videos?: unknown[];
}

export interface AdminExerciseOptions {
    physio_areas: {
        id: number;
        name: string;
        subareas?: { id: number; name: string }[];
    }[];
    body_regions: {
        id: number;
        name: string;
        children?: { id: number; name: string }[];
    }[];
    difficulties: Record<string, string>;
    movement_forms: Record<string, string>;
    videos: unknown[];
}

export interface AdminExercisesRepository {
    list(params?: {
        search?: string;
        physio_area_id?: number;
        physio_subarea_id?: number;
        body_region_id?: number;
        difficulty_level?: string;
        movement_form?: string;
        is_active?: boolean;
        per_page?: number;
        page?: number;
    }): Promise<{
        data: AdminExercise[];
        meta: { currentPage: number; lastPage: number; total: number };
    }>;
    getById(id: number): Promise<AdminExercise | null>;
    getOptions(): Promise<AdminExerciseOptions>;
    create(data: Record<string, unknown>): Promise<AdminExercise>;
    update(id: number, data: Record<string, unknown>): Promise<AdminExercise>;
    destroy(id: number): Promise<void>;
}

/** Vídeo (admin) - listagem e CRUD */
export interface AdminVideo {
    id: number;
    filename: string;
    original_filename: string | null;
    url: string | null;
    cdn_url: string | null;
    thumbnail_url: string | null;
    size: number | null;
    human_size: string;
    duration: number | null;
    human_duration: string | null;
    metadata: Record<string, unknown> | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    mime_type: string | null;
}

export interface AdminVideosListMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface AdminVideosRepository {
    list(params?: { per_page?: number; page?: number }): Promise<{
        data: AdminVideo[];
        meta: AdminVideosListMeta;
    }>;
    getById(id: number): Promise<AdminVideo | null>;
    requestPresignedUpload(params: {
        filename: string;
        mime_type: string;
        size: number;
    }): Promise<{
        video_id: number;
        upload_url: string;
        path: string;
        expires_at: string;
        video: AdminVideo;
    }>;
    requestPresignedThumbnail(
        videoId: number,
        params: {
            filename: string;
            mime_type: string;
            size: number;
        },
    ): Promise<{ upload_url: string; path: string; expires_at: string }>;
    requestPresignedThumbnailReplace(
        videoId: number,
        params: {
            filename: string;
            mime_type: string;
            size: number;
        },
    ): Promise<{ upload_url: string; path: string; expires_at: string }>;
    confirmUpload(
        videoId: number,
        params?: {
            thumbnail_path?: string;
            original_filename?: string;
            duration?: number;
            metadata?: Record<string, unknown>;
        },
    ): Promise<AdminVideo>;
    update(
        videoId: number,
        data: {
            original_filename?: string;
            duration?: number | null;
            metadata?: Record<string, unknown>;
            thumbnail_path?: string;
        },
    ): Promise<AdminVideo>;
    /**
     * Persiste até 2 paths R2 já enviados via presigned (PUT …/reference-images).
     * Requer backend T024.
     */
    syncReferenceImages(videoId: number, paths: string[]): Promise<AdminVideo>;
    destroy(id: number): Promise<void>;
}

// ── Admin Programs ─────────────────────────────────────────────────────────

export interface AdminProgramExerciseWriteDto {
    exerciseId: number;
    groupIndex: number;
    daysOfWeek: number[] | null;
    period: 'morning' | 'afternoon' | 'night' | null;
    setsMin: number | null;
    setsMax: number | null;
    repetitionsMin: number | null;
    repetitionsMax: number | null;
    loadMin: number | null;
    loadMax: number | null;
    restTime: number | null;
    notes: string;
    sortOrder: number;
}

export interface AdminProgramGroupWriteDto {
    name: string;
    sortOrder: number;
}

export interface AdminProgramWriteDto {
    title: string;
    description?: string | null;
    physioAreaId?: number | null;
    physioSubareaId?: number | null;
    durationMinutes?: number | null;
    isActive?: boolean;
    groups: AdminProgramGroupWriteDto[];
    exercises: AdminProgramExerciseWriteDto[];
}

export interface AdminProgramsRepository {
    list(params?: {
        search?: string;
        physioAreaId?: number | null;
        isActive?: boolean;
        perPage?: number;
        page?: number;
    }): Promise<{
        data: AdminProgram[];
        meta: { currentPage: number; lastPage: number; total: number };
    }>;
    getById(id: number): Promise<AdminProgram>;
    getDetail(id: number): Promise<AdminProgram>;
    create(dto: AdminProgramWriteDto): Promise<AdminProgram>;
    update(
        id: number,
        dto: Partial<AdminProgramWriteDto>,
    ): Promise<AdminProgram>;
    destroy(id: number): Promise<void>;
}
