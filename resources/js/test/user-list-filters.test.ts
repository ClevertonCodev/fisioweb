import { describe, expect, it } from 'vitest';

import {
    applyUserListFilters,
    DEFAULT_USER_LIST_FILTERS,
    parseUserListFilters,
    serializeUserListFilters,
    sortTeam,
} from '@/application/clinic/user-list-filters';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

function makeUser(
    id: string,
    overrides: Partial<ClinicUserSummary> = {},
): ClinicUserSummary {
    return {
        id,
        name: `Pessoa ${id}`,
        email: `pessoa${id}@example.com`,
        role: 'physiotherapist',
        mestre: 0,
        status: 1,
        ...overrides,
    };
}

const parse = (query: string) =>
    parseUserListFilters(new URLSearchParams(query));

describe('parseUserListFilters', () => {
    it('sem parâmetros, devolve o padrão', () => {
        expect(parse('')).toEqual(DEFAULT_USER_LIST_FILTERS);
        expect(DEFAULT_USER_LIST_FILTERS).toEqual({
            search: '',
            roles: [],
            status: 'todos',
        });
    });

    it('lê busca, funções e status', () => {
        expect(
            parse('q=%20ana%20&funcao=admin,physiotherapist&status=ativos'),
        ).toEqual({
            search: 'ana',
            roles: ['admin', 'physiotherapist'],
            status: 'ativos',
        });
        expect(parse('status=inativos').status).toBe('inativos');
    });

    it('função desconhecida e repetida caem fora', () => {
        expect(parse('funcao=foo,secretary,secretary,ADMIN').roles).toEqual([
            'secretary',
        ]);
    });

    it('status inválido cai no padrão', () => {
        expect(parse('status=xyz').status).toBe('todos');
        expect(parse('status=todos').status).toBe('todos');
    });
});

describe('serializeUserListFilters', () => {
    it('padrão não vai para a URL', () => {
        expect(
            serializeUserListFilters(DEFAULT_USER_LIST_FILTERS).toString(),
        ).toBe('');
        expect(
            serializeUserListFilters({
                ...DEFAULT_USER_LIST_FILTERS,
                search: '   ',
            }).toString(),
        ).toBe('');
    });

    it('escreve busca sem espaços nas pontas, funções e status', () => {
        const params = serializeUserListFilters({
            search: ' ana ',
            roles: ['admin', 'secretary'],
            status: 'inativos',
        });
        expect(params.get('q')).toBe('ana');
        expect(params.get('funcao')).toBe('admin,secretary');
        expect(params.get('status')).toBe('inativos');
    });

    it('ida e volta preserva o filtro', () => {
        const filters = {
            search: 'ana',
            roles: ['physiotherapist' as const],
            status: 'ativos' as const,
        };
        expect(parseUserListFilters(serializeUserListFilters(filters))).toEqual(
            filters,
        );
    });
});

describe('applyUserListFilters', () => {
    const team = [
        makeUser('1', { name: 'João Araújo', role: 'admin' }),
        makeUser('2', { name: 'Maria', email: 'contato@clinica.com' }),
        makeUser('3', { name: 'Bia', role: 'secretary', status: 0 }),
    ];
    const ids = (list: ClinicUserSummary[]) => list.map((u) => u.id);

    it('busca por nome ou e-mail, sem acento nem maiúscula', () => {
        const f = DEFAULT_USER_LIST_FILTERS;
        expect(
            ids(applyUserListFilters(team, { ...f, search: 'joao ara' })),
        ).toEqual(['1']);
        expect(
            ids(applyUserListFilters(team, { ...f, search: 'CLINICA' })),
        ).toEqual(['2']);
    });

    it('filtra por uma ou mais funções', () => {
        const f = DEFAULT_USER_LIST_FILTERS;
        expect(
            ids(
                applyUserListFilters(team, {
                    ...f,
                    roles: ['admin', 'secretary'],
                }),
            ),
        ).toEqual(['1', '3']);
    });

    it('filtra por status', () => {
        const f = DEFAULT_USER_LIST_FILTERS;
        expect(
            ids(applyUserListFilters(team, { ...f, status: 'ativos' })),
        ).toEqual(['1', '2']);
        expect(
            ids(applyUserListFilters(team, { ...f, status: 'inativos' })),
        ).toEqual(['3']);
        expect(ids(applyUserListFilters(team, f))).toEqual(['1', '2', '3']);
    });
});

describe('sortTeam', () => {
    it('mestre primeiro, depois por nome', () => {
        const sorted = sortTeam([
            makeUser('1', { name: 'Zeca' }),
            makeUser('2', { name: 'Ana' }),
            makeUser('3', { name: 'Mestre', mestre: 1 }),
        ]);
        expect(sorted.map((u) => u.id)).toEqual(['3', '2', '1']);
    });
});
