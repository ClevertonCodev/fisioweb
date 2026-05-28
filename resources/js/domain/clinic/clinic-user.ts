import type { ClinicRole } from '@/domain/auth/session';

export interface ClinicUserSummary {
    id: string;
    name: string;
    role: ClinicRole;
    status: number;
    email: string;
    document?: string;
}
