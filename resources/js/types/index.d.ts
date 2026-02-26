import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Plan {
    id: number;
    name: string;
    type_charge: string;
    value_month: number;
    value_year: number;
    created_at: string;
    updated_at: string;
}

export interface Feature {
    id: number;
    key: string;
    name: string;
    value_isolated: number | null;
    type: string;
    created_at: string;
    updated_at: string;
}

export interface FeaturePlan {
    id: number;
    plan_id: number;
    feature_id: number;
    value: boolean;
    plan: { id: number; name: string };
    feature: { id: number; name: string };
}

export interface PhysioArea {
    id: number;
    name: string;
    description: string | null;
    subareas?: PhysioSubarea[];
}

export interface PhysioSubarea {
    id: number;
    physio_area_id: number;
    name: string;
}

export interface BodyRegion {
    id: number;
    name: string;
    parent_id: number | null;
    children?: BodyRegion[];
}

export interface Video {
    id: number;
    filename: string;
    original_filename: string;
    path: string;
    url: string | null;
    cdn_url: string | null;
    mime_type: string;
    size: number;
    duration: number | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    thumbnail_url?: string | null;
    human_size?: string;
    human_duration?: string | null;
}

export interface Exercise {
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
    created_by: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    physio_area?: PhysioArea;
    physio_subarea?: PhysioSubarea | null;
    body_region?: BodyRegion;
    created_by_user?: User;
    videos?: Video[];
    is_favorite?: boolean;
}

export interface Patient {
    id: number;
    name: string;
    cpf: string | null;
    email: string | null;
    phone: string | null;
    gender: string | null;
    biological_sex: string | null;
    birth_date: string | null;
    marital_status: string | null;
    education: string | null;
    profession: string | null;
    emergency_contact: string | null;
    caregiver_contact: string | null;
    insurance: string | null;
    insurance_number: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
    referral_source: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    registered_by_name?: string | null;
    registered_by_initial?: string | null;
    treatment_plans?: TreatmentPlan[];
}

export interface TreatmentPlan {
    id: number;
    clinic_id: number;
    patient_id: number | null;
    clinic_user_id: number;
    title: string;
    message: string | null;
    physio_area_id: number | null;
    physio_subarea_id: number | null;
    start_date: string | null;
    end_date: string | null;
    duration_minutes: number | null;
    status: 'draft' | 'active' | 'completed' | 'cancelled';
    notes: string | null;
    created_at: string;
    updated_at: string;
    patient?: Patient | null;
    clinic_user?: { id: number; name: string };
    physio_area?: PhysioArea | null;
    physio_subarea?: PhysioSubarea | null;
    groups?: TreatmentPlanGroup[];
    exercises?: TreatmentPlanExercise[];
}

export interface TreatmentPlanGroup {
    id: number;
    treatment_plan_id: number;
    name: string;
    sort_order: number;
    exercises?: TreatmentPlanExercise[];
}

export interface TreatmentPlanExercise {
    id: number;
    treatment_plan_id: number;
    treatment_plan_group_id: number | null;
    exercise_id: number;
    days_of_week: string[] | null;
    period: 'morning' | 'afternoon' | 'night' | null;
    sets_min: number | null;
    sets_max: number | null;
    repetitions_min: number | null;
    repetitions_max: number | null;
    load_min: number | null;
    load_max: number | null;
    rest_time: string | null;
    notes: string | null;
    sort_order: number;
    exercise?: Exercise;
}

export interface Clinic {
    id: number;
    name: string;
    document: string;
    type_person: string;
    status: number;
    email: string;
    phone: string | null;
    slug: string | null;
    zip_code: string | null;
    address: string | null;
    number: string | null;
    city: string | null;
    state: string | null;
    plan_id: number | null;
    plan?: Plan | null;
    created_at: string;
    updated_at: string;
}
