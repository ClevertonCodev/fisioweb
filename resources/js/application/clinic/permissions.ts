import type { ClinicRole } from '@/domain/auth/session';

export const can = {
    delete: (role?: ClinicRole) => role === 'admin',
    deleteOwn: (role?: ClinicRole) => role === 'admin' || role === 'physiotherapist',
    manageUsers: (role?: ClinicRole) => role === 'admin' || role === 'secretary',
    sign: (role?: ClinicRole) => role === 'admin' || role === 'physiotherapist',
    bulkInactivate: (role?: ClinicRole) => role === 'admin' || role === 'secretary',
    manageClinicalRecords: (role?: ClinicRole) => role === 'admin' || role === 'physiotherapist',
};
