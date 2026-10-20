import { describe, expect, it } from 'vitest';

import {
    clinicUserLocks,
    isLastActiveAdmin,
} from '@/application/clinic/clinic-user-locks';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

function makeUser(
    id: string,
    overrides: Partial<ClinicUserSummary> = {},
): ClinicUserSummary {
    return {
        id,
        name: `Pessoa ${id}`,
        email: `p${id}@example.com`,
        role: 'admin',
        mestre: 0,
        status: 1,
        ...overrides,
    };
}

describe('isLastActiveAdmin', () => {
    it('conta só admins ativos', () => {
        const only = makeUser('1');
        const inactiveAdmin = makeUser('2', { status: 0 });
        const physio = makeUser('3', { role: 'physiotherapist' });
        const team = [only, inactiveAdmin, physio];

        expect(isLastActiveAdmin(only, team)).toBe(true);
        expect(isLastActiveAdmin(inactiveAdmin, team)).toBe(false);
        expect(isLastActiveAdmin(physio, team)).toBe(false);
    });

    it('com dois admins ativos, nenhum é o último', () => {
        const a = makeUser('1');
        const b = makeUser('2');
        expect(isLastActiveAdmin(a, [a, b])).toBe(false);
    });
});

describe('clinicUserLocks', () => {
    it('mestre: não muda de função, não desativa, não exclui', () => {
        const master = makeUser('1', { mestre: 1 });
        const other = makeUser('2');
        const locks = clinicUserLocks(master, [master, other]);

        expect(locks.roleChange).toMatch(/mestre/i);
        expect(locks.deactivate).toMatch(/mestre/i);
        expect(locks.canDelete).toBe(false);
    });

    it('último admin ativo: as mesmas travas, com outro motivo', () => {
        const last = makeUser('1');
        const physio = makeUser('2', { role: 'physiotherapist' });
        const locks = clinicUserLocks(last, [last, physio]);

        expect(locks.roleChange).toMatch(/administrador ativo/i);
        expect(locks.deactivate).toMatch(/administrador ativo/i);
        expect(locks.canDelete).toBe(false);
    });

    it('pessoa comum: nada travado', () => {
        const admin = makeUser('1', { mestre: 1 });
        const physio = makeUser('2', { role: 'physiotherapist' });
        expect(clinicUserLocks(physio, [admin, physio])).toEqual({
            roleChange: null,
            deactivate: null,
            canDelete: true,
        });
    });

    it('mestre inativo (dado legado) pode ser reativado', () => {
        const master = makeUser('1', { mestre: 1, status: 0 });
        const admin = makeUser('2');
        expect(clinicUserLocks(master, [master, admin]).deactivate).toBeNull();
    });
});
