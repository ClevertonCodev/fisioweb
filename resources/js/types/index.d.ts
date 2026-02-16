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
