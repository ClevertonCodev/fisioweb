import { describe, expect, it } from 'vitest';

import {
    activeModelFilterCount,
    applyModelFilters,
    fromMine,
    INITIAL_MODEL_FILTERS,
    modelChips,
    regionsOf,
    removeModelChip,
    type ModelSummary,
} from '@/application/clinic/program-models';
import type { Program } from '@/domain/clinic';

function model(overrides: Partial<ModelSummary> = {}): ModelSummary {
    return {
        key: 'nossos-1',
        origin: 'nossos',
        id: '1',
        title: 'Reabilitação lombar — fase 1',
        description: 'Protocolo para lombalgia',
        area: 'Ortopedia',
        exerciseCount: 4,
        durationMinutes: 20,
        author: 'Sistema',
        createdAt: null,
        ...overrides,
    };
}

describe('regionsOf', () => {
    it('coloca um título conhecido na região esperada', () => {
        expect(regionsOf(model())).toContain('lombar');
        expect(
            regionsOf(model({ title: 'Joelho pós-LCA', description: '' })),
        ).toContain('joelho');
    });
});

describe('applyModelFilters', () => {
    it('recorta por especialidade e busca', () => {
        const items = [
            model(),
            model({
                key: 'nossos-2',
                id: '2',
                title: 'Cervical',
                area: 'Neurologia',
            }),
        ];
        expect(
            applyModelFilters(items, { search: 'lombar', areas: [] }).map(
                (m) => m.id,
            ),
        ).toEqual(['1']);
        expect(
            applyModelFilters(items, {
                search: '',
                areas: ['Neurologia'],
            }).map((m) => m.id),
        ).toEqual(['2']);
    });

    it('conta a busca e o Limpar do chip zera só ela', () => {
        const filters = { ...INITIAL_MODEL_FILTERS, search: 'lombar' };
        expect(activeModelFilterCount(filters)).toBe(1);
        expect(modelChips(filters)).toEqual([
            { key: 'search', label: 'Busca', value: 'lombar' },
        ]);
        expect(removeModelChip(filters, 'search')).toEqual({
            ...filters,
            search: '',
        });
    });
});

describe('fromMine', () => {
    it('marca modelos da clínica sem paciente', () => {
        const mapped = fromMine({
            id: '9',
            title: 'Meu protocolo',
            patientId: null,
            patientName: null,
            message: '',
            groups: [],
            exerciseCount: 2,
            professionalName: 'Ana',
            createdAt: '2026-10-01T00:00:00Z',
        } as Program);
        expect(mapped.origin).toBe('meus');
        expect(mapped.author).toBe('Ana');
    });
});
