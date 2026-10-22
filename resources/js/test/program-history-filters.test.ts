import { describe, expect, it } from 'vitest';

import {
    applyFilters,
    historyChips,
    INITIAL_FILTERS,
    removeChip,
    uiStatusOf,
} from '@/application/clinic/program-history-filters';
import type { Program } from '@/domain/clinic';

function program(overrides: Partial<Program> = {}): Program {
    return {
        id: '1',
        title: 'Reabilitação Lombar',
        patientId: '10',
        patientName: 'Ana Souza',
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: null,
        professionalId: '1',
        professionalName: 'Cleverton',
        professionalPhotoUrl: null,
        exerciseCount: 5,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        message: '',
        groups: [],
        status: 'active',
        patientViewedAt: null,
        patientCompletedCount: 0,
        createdAt: '2026-01-01T00:00:00Z',
        ...overrides,
    };
}

describe('program-history-filters', () => {
    it('restringe a lista ao patientId da URL', () => {
        const items = [
            program({ id: '1', patientId: '10', patientName: 'Ana' }),
            program({ id: '2', patientId: '20', patientName: 'Bruno' }),
        ];

        const filtered = applyFilters(items, INITIAL_FILTERS, '10');

        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe('1');
    });

    it('classifica status derivado: não visto, visto, completou e rascunho', () => {
        expect(
            uiStatusOf(program({ status: 'active', patientViewedAt: null })),
        ).toBe('not_viewed');
        expect(
            uiStatusOf(
                program({
                    status: 'active',
                    patientViewedAt: '2026-03-01T12:00:00Z',
                }),
            ),
        ).toBe('viewed');
        expect(uiStatusOf(program({ status: 'completed' }))).toBe('completed');
        expect(uiStatusOf(program({ status: 'draft' }))).toBe('draft');
    });

    it('busca por título, paciente ou profissional ignorando acento', () => {
        const items = [
            program({
                id: '1',
                title: 'Reabilitação Lombar',
                patientName: 'Ana',
            }),
            program({
                id: '2',
                title: 'Joelho',
                patientName: 'José',
                professionalName: 'Marina',
            }),
        ];

        expect(
            applyFilters(
                items,
                { ...INITIAL_FILTERS, search: 'reabilitacao' },
                null,
            ),
        ).toHaveLength(1);
        expect(
            applyFilters(items, { ...INITIAL_FILTERS, search: 'jose' }, null)[0]
                ?.id,
        ).toBe('2');
        expect(
            applyFilters(
                items,
                { ...INITIAL_FILTERS, search: 'marina' },
                null,
            )[0]?.id,
        ).toBe('2');
    });

    it('filtra por status derivado e o chip remove só aquele status', () => {
        const items = [
            program({
                id: '1',
                status: 'draft',
                patientId: null,
                patientName: null,
            }),
            program({ id: '2', status: 'active', patientViewedAt: null }),
        ];
        const filters = { ...INITIAL_FILTERS, statuses: ['draft' as const] };

        expect(applyFilters(items, filters, null)).toHaveLength(1);
        expect(applyFilters(items, filters, null)[0]?.id).toBe('1');

        const chips = historyChips(filters, [], null);
        expect(chips).toEqual([
            { key: 'status:draft', label: 'Status', value: 'Rascunho' },
        ]);
        expect(removeChip(filters, chips[0]!)).toEqual({ statuses: [] });
    });
});
