import { describe, expect, it } from 'vitest';

import { can } from '@/application/clinic/permissions';
import type { ClinicRole } from '@/domain/auth/session';

const ROLES: ClinicRole[] = ['admin', 'secretary', 'physiotherapist'];

describe('can.delete', () => {
    it('permite apenas admin', () => {
        expect(can.delete('admin')).toBe(true);
        expect(can.delete('secretary')).toBe(false);
        expect(can.delete('physiotherapist')).toBe(false);
    });

    it('nega quando role é undefined', () => {
        expect(can.delete(undefined)).toBe(false);
    });
});

describe('can.deleteOwn', () => {
    it('permite admin e physiotherapist', () => {
        expect(can.deleteOwn('admin')).toBe(true);
        expect(can.deleteOwn('physiotherapist')).toBe(true);
    });

    it('nega secretary', () => {
        expect(can.deleteOwn('secretary')).toBe(false);
    });

    it('nega quando role é undefined', () => {
        expect(can.deleteOwn(undefined)).toBe(false);
    });
});

describe('can.manageUsers', () => {
    it('permite admin e secretary', () => {
        expect(can.manageUsers('admin')).toBe(true);
        expect(can.manageUsers('secretary')).toBe(true);
    });

    it('nega physiotherapist', () => {
        expect(can.manageUsers('physiotherapist')).toBe(false);
    });

    it('nega quando role é undefined', () => {
        expect(can.manageUsers(undefined)).toBe(false);
    });
});

describe('can.sign', () => {
    it('permite admin e physiotherapist', () => {
        expect(can.sign('admin')).toBe(true);
        expect(can.sign('physiotherapist')).toBe(true);
    });

    it('nega secretary', () => {
        expect(can.sign('secretary')).toBe(false);
    });

    it('nega quando role é undefined', () => {
        expect(can.sign(undefined)).toBe(false);
    });
});

describe('can.bulkInactivate', () => {
    it('permite admin e secretary', () => {
        expect(can.bulkInactivate('admin')).toBe(true);
        expect(can.bulkInactivate('secretary')).toBe(true);
    });

    it('nega physiotherapist', () => {
        expect(can.bulkInactivate('physiotherapist')).toBe(false);
    });

    it('nega quando role é undefined', () => {
        expect(can.bulkInactivate(undefined)).toBe(false);
    });
});

describe('can.manageClinicalRecords', () => {
    it('permite admin e physiotherapist', () => {
        expect(can.manageClinicalRecords('admin')).toBe(true);
        expect(can.manageClinicalRecords('physiotherapist')).toBe(true);
    });

    it('nega secretary', () => {
        expect(can.manageClinicalRecords('secretary')).toBe(false);
    });

    it('nega quando role é undefined', () => {
        expect(can.manageClinicalRecords(undefined)).toBe(false);
    });
});

describe('matriz de permissões — todos os roles cobertos', () => {
    it.each(ROLES)('role %s sempre retorna boolean em todas as permissões', (role) => {
        expect(typeof can.delete(role)).toBe('boolean');
        expect(typeof can.deleteOwn(role)).toBe('boolean');
        expect(typeof can.manageUsers(role)).toBe('boolean');
        expect(typeof can.sign(role)).toBe('boolean');
        expect(typeof can.bulkInactivate(role)).toBe('boolean');
        expect(typeof can.manageClinicalRecords(role)).toBe('boolean');
    });
});
