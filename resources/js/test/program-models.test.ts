import { describe, expect, it } from 'vitest';

import {
    activeModelFilterCount,
    applyModelFilters,
    doseOf,
    fromMine,
    INITIAL_MODEL_FILTERS,
    modelChips,
    regionsOf,
    removeModelChip,
    scheduleOf,
    type ModelExercise,
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

describe('doseOf e scheduleOf (exercício do modelo)', () => {
    const base: ModelExercise = {
        id: 'e1',
        title: 'Ponte',
        thumbnailUrl: '',
        videoUrl: '',
        days: [],
        period: null,
        setsMin: 3,
        setsMax: 3,
        repsMin: 10,
        repsMax: 12,
        loadMin: null,
        loadMax: null,
        restTime: null,
        notes: null,
    };

    it('carga 0 e descanso 0 não viram "0 kg" nem "0 s de descanso"', () => {
        expect(
            doseOf({ ...base, loadMin: 0, loadMax: 0, restTime: 0 }),
        ).toEqual([
            { key: 'sets', value: '3', unit: 'séries' },
            { key: 'reps', value: '10–12', unit: 'repetições' },
        ]);
    });

    it('sem dias e sem período não tem agenda; com os sete dias é "Todos os dias"', () => {
        expect(scheduleOf(base)).toBeNull();
        expect(
            scheduleOf({
                ...base,
                days: [0, 1, 2, 3, 4, 5, 6],
                period: 'tarde',
            }),
        ).toBe('Todos os dias · Tarde');
        expect(scheduleOf({ ...base, days: [5, 1] })).toBe('Seg, Sex');
    });
});
