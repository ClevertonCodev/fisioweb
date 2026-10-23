import { describe, expect, it } from 'vitest';

import {
    matchesSearch,
    tabFromSearchParam,
    type RecordItem,
} from '@/pages/clinic/patient/patient-record/data';

function item(
    kind: RecordItem['kind'],
    title: string,
    subtitle = '',
): RecordItem {
    return {
        key: `${kind}-1`,
        kind,
        date: new Date('2026-10-22T12:00:00'),
        title,
        subtitle,
        author: null,
        status: null,
        pending: false,
        future: false,
        source: { kind, item: {} },
    } as RecordItem;
}

describe('tabFromSearchParam', () => {
    it('aceita as quatro abas da B', () => {
        expect(tabFromSearchParam('clinico')).toBe('clinico');
        expect(tabFromSearchParam('agenda')).toBe('agenda');
        expect(tabFromSearchParam('programas')).toBe('programas');
        expect(tabFromSearchParam('arquivos')).toBe('arquivos');
    });

    it('tab da v1 ou valor inválido cai em Clínico', () => {
        expect(tabFromSearchParam('questionnaires')).toBe('clinico');
        expect(tabFromSearchParam('evolutions')).toBe('clinico');
        expect(tabFromSearchParam('foo')).toBe('clinico');
        expect(tabFromSearchParam(null)).toBe('clinico');
    });
});

describe('matchesSearch', () => {
    it('filtra evolução, avaliação, questionário e arquivo', () => {
        expect(matchesSearch(item('evolucao', 'Lombar aguda'), 'aguda')).toBe(
            true,
        );
        expect(matchesSearch(item('evolucao', 'Lombar aguda'), 'joelho')).toBe(
            false,
        );
        expect(
            matchesSearch(item('avaliacao', 'SF-36', 'Avaliação'), 'sf-36'),
        ).toBe(true);
        expect(matchesSearch(item('arquivo', 'raio-x.pdf'), 'raio')).toBe(true);
    });

    it('não esconde consulta nem programa', () => {
        expect(matchesSearch(item('consulta', 'Sessão'), 'xyz')).toBe(true);
        expect(matchesSearch(item('programa', 'Casa'), 'xyz')).toBe(true);
    });
});
