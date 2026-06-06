import type { ClinicRole } from '@/domain/auth/session';

export interface ClinicUserSummary {
    id: string;
    name: string;
    role: ClinicRole;
    mestre: 0 | 1;
    status: number;
    email: string;
    document?: string;
}
