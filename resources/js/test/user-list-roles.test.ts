import { describe, expect, it } from 'vitest';

import {
    CAPABILITIES,
    capabilityDiff,
} from '@/pages/clinic/user/user-list/roles';

function table(role: 'admin' | 'physiotherapist' | 'secretary') {
    return Object.fromEntries(CAPABILITIES.map((c) => [c.key, c.access(role)]));
}

describe('capacidades por função', () => {
    it('administrador', () => {
        expect(table('admin')).toEqual({
            agenda: 'De todos',
            records: true,
            sign: true,
            reactivate: true,
            delete: true,
            users: true,
            clinic: 'Só o mestre edita',
        });
    });

    it('fisioterapeuta', () => {
        expect(table('physiotherapist')).toEqual({
            agenda: 'Só a própria',
            records: true,
            sign: 'Só os seus',
            reactivate: false,
            delete: 'Só os seus',
            users: false,
            clinic: false,
        });
    });

    it('secretário(a)', () => {
        expect(table('secretary')).toEqual({
            agenda: 'De todos',
            records: false,
            sign: false,
            reactivate: true,
            delete: false,
            users: false,
            clinic: false,
        });
    });
});

describe('capabilityDiff: ganha ou perde', () => {
    const changes = (
        from: 'admin' | 'physiotherapist' | 'secretary',
        to: 'admin' | 'physiotherapist' | 'secretary',
    ) =>
        Object.fromEntries(
            capabilityDiff(from, to).map((c) => [c.key, c.change]),
        );

    it('rebaixar administrador para fisioterapeuta só perde', () => {
        expect(changes('admin', 'physiotherapist')).toEqual({
            agenda: 'loss',
            sign: 'loss',
            reactivate: 'loss',
            delete: 'loss',
            users: 'loss',
            clinic: 'loss',
        });
    });

    it('secretário(a) para fisioterapeuta: agenda e inativar caem, prontuário sobe', () => {
        expect(changes('secretary', 'physiotherapist')).toEqual({
            agenda: 'loss',
            records: 'gain',
            sign: 'gain',
            reactivate: 'loss',
            delete: 'gain',
        });
    });

    it('promover fisioterapeuta a administrador: passa a assinar de todos', () => {
        expect(changes('physiotherapist', 'admin')).toMatchObject({
            agenda: 'gain',
            sign: 'gain',
            delete: 'gain',
        });
    });
});

describe('capabilityDiff', () => {
    it('lista só o que muda entre as funções', () => {
        expect(
            capabilityDiff('physiotherapist', 'secretary').map((c) => c.key),
        ).toEqual(['agenda', 'records', 'sign', 'reactivate', 'delete']);
        expect(capabilityDiff('admin', 'admin')).toEqual([]);
    });
});
