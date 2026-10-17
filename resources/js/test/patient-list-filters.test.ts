import { describe, expect, it } from 'vitest';

import {
    DEFAULT_PATIENT_LIST_FILTERS,
    parsePatientListFilters,
    serializePatientListFilters,
    toPatientListParams,
} from '@/application/clinic/patient-list-filters';

function parse(query: string) {
    return parsePatientListFilters(new URLSearchParams(query));
}

describe('parsePatientListFilters: busca, página e itens por página', () => {
    it('URL vazia dá os filtros padrão', () => {
        expect(parse('')).toEqual(DEFAULT_PATIENT_LIST_FILTERS);
        expect(DEFAULT_PATIENT_LIST_FILTERS.page).toBe(1);
        expect(DEFAULT_PATIENT_LIST_FILTERS.perPage).toBe(15);
    });

    it('lê q, page e per_page', () => {
        expect(parse('q=maria&page=2&per_page=30')).toMatchObject({
            search: 'maria',
            page: 2,
            perPage: 30,
        });
    });

    it.each(['200', '10', 'abc', '0', '-15', '30.5'])(
        'per_page=%s fora de 15/30/50 cai para 15',
        (value) => {
            expect(parse(`per_page=${value}`).perPage).toBe(15);
        },
    );

    it.each(['0', '-1', 'abc', '1.5', ''])(
        'page=%s inválida cai para 1',
        (value) => {
            expect(parse(`page=${value}`).page).toBe(1);
        },
    );

    it('busca só com espaços conta como vazia', () => {
        expect(parse('q=%20%20').search).toBe('');
    });
});

describe('serializePatientListFilters', () => {
    it('filtros padrão não vão para a URL', () => {
        expect(
            serializePatientListFilters(
                DEFAULT_PATIENT_LIST_FILTERS,
            ).toString(),
        ).toBe('');
    });

    it('escreve q, page e per_page diferentes do padrão', () => {
        const params = serializePatientListFilters({
            ...DEFAULT_PATIENT_LIST_FILTERS,
            search: 'maria',
            page: 2,
            perPage: 30,
        });
        expect(params.get('q')).toBe('maria');
        expect(params.get('page')).toBe('2');
        expect(params.get('per_page')).toBe('30');
    });

    it('ida e volta pela URL devolve os mesmos filtros', () => {
        const filters = {
            ...DEFAULT_PATIENT_LIST_FILTERS,
            search: 'joão da silva',
            page: 3,
            perPage: 50,
        };
        expect(
            parsePatientListFilters(serializePatientListFilters(filters)),
        ).toEqual(filters);
    });
});

describe('parsePatientListFilters: filtros', () => {
    it('lê situação, status, profissionais e intervalo de cadastro', () => {
        expect(
            parse(
                'situacao=inativos&status=alta,em_tratamento&prof=12,34&de=2026-01-01&ate=2026-03-31',
            ),
        ).toMatchObject({
            situation: 'inativos',
            statuses: ['alta', 'em_tratamento'],
            professionalIds: ['12', '34'],
            dateFrom: '2026-01-01',
            dateTo: '2026-03-31',
        });
    });

    it('sem filtros na URL: ativos e inativos, nada marcado, sem datas', () => {
        expect(parse('')).toMatchObject({
            situation: 'todos',
            statuses: [],
            professionalIds: [],
            dateFrom: null,
            dateTo: null,
        });
    });

    it.each(['qualquer', 'todos', ''])(
        'situacao=%s inválida cai em ativos e inativos',
        (value) => {
            expect(parse(`situacao=${value}`).situation).toBe('todos');
        },
    );

    it('descarta status desconhecido e repetido', () => {
        expect(parse('status=xyz,alta,alta,,obito').statuses).toEqual([
            'alta',
            'obito',
        ]);
    });

    it('descarta id de profissional que não é inteiro positivo', () => {
        expect(parse('prof=12,abc,0,-3,1.5,12,7').professionalIds).toEqual([
            '12',
            '7',
        ]);
    });

    it.each(['2026-13-45', '2026-02-30', '01/02/2026', 'abc'])(
        'descarta data malformada: de=%s',
        (value) => {
            expect(parse(`de=${value}&ate=2026-12-31`)).toMatchObject({
                dateFrom: null,
                dateTo: null,
            });
        },
    );

    it('ignora "ate" sem "de"', () => {
        expect(parse('ate=2026-03-31').dateTo).toBeNull();
    });

    it('ignora "ate" antes de "de"', () => {
        expect(parse('de=2026-03-31&ate=2026-01-01')).toMatchObject({
            dateFrom: '2026-03-31',
            dateTo: null,
        });
    });
});

describe('serializePatientListFilters: filtros', () => {
    it('escreve os filtros e faz a ida e volta sem perda', () => {
        const filters = {
            ...DEFAULT_PATIENT_LIST_FILTERS,
            situation: 'ativos' as const,
            statuses: ['alta' as const, 'obito' as const],
            professionalIds: ['3', '9'],
            dateFrom: '2026-01-01',
            dateTo: '2026-02-01',
        };
        const params = serializePatientListFilters(filters);

        expect(params.get('situacao')).toBe('ativos');
        expect(params.get('status')).toBe('alta,obito');
        expect(params.get('prof')).toBe('3,9');
        expect(params.get('de')).toBe('2026-01-01');
        expect(params.get('ate')).toBe('2026-02-01');
        expect(parsePatientListFilters(params)).toEqual(filters);
    });
});

describe('toPatientListParams', () => {
    it('traduz os filtros para os parâmetros da listagem', () => {
        expect(
            toPatientListParams({
                ...DEFAULT_PATIENT_LIST_FILTERS,
                search: 'ana',
                situation: 'inativos',
                statuses: ['alta'],
                professionalIds: ['3'],
                dateFrom: '2026-01-01',
                dateTo: '2026-02-01',
            }),
        ).toEqual({
            page: 1,
            perPage: 15,
            search: 'ana',
            isActive: false,
            statuses: ['alta'],
            professionalIds: ['3'],
            dateFrom: '2026-01-01',
            dateTo: '2026-02-01',
        });
    });

    it('ativos e inativos e listas vazias não vão para a API', () => {
        expect(toPatientListParams(DEFAULT_PATIENT_LIST_FILTERS)).toEqual({
            page: 1,
            perPage: 15,
            search: undefined,
            isActive: undefined,
            statuses: undefined,
            professionalIds: undefined,
            dateFrom: undefined,
            dateTo: undefined,
        });
        expect(
            toPatientListParams({
                ...DEFAULT_PATIENT_LIST_FILTERS,
                situation: 'ativos',
            }).isActive,
        ).toBe(true);
    });
});
