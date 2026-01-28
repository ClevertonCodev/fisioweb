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
