import { describe, expect, it } from 'vitest';

import {
    flattenHistoryPages,
    nextHistoryPage,
} from '@/application/clinic/patient-history-pages';
import type { PatientAppointmentHistoryPage } from '@/application/clinic/ports';
import type { PatientAppointmentHistoryItem } from '@/domain/clinic';

function item(id: string): PatientAppointmentHistoryItem {
    return {
        id,
        startsAt: '2026-10-01T10:00:00Z',
        endsAt: '2026-10-01T11:00:00Z',
        title: 'Sessão',
        clinicUserName: 'Profissional',
        status: 'completed',
    };
}

function page(
    currentPage: number,
    lastPage: number,
    ids: string[],
): PatientAppointmentHistoryPage {
    return {
        items: ids.map(item),
        total: 99,
        perPage: 50,
        currentPage,
        lastPage,
    };
}

describe('nextHistoryPage', () => {
    it('pede a página seguinte enquanto houver', () => {
        expect(nextHistoryPage(page(1, 3, ['a']))).toBe(2);
        expect(nextHistoryPage(page(2, 3, ['a']))).toBe(3);
    });

    it('para na última página e quando não há acesso', () => {
        expect(nextHistoryPage(page(3, 3, ['a']))).toBeUndefined();
        expect(nextHistoryPage(null)).toBeUndefined();
    });
});

describe('flattenHistoryPages', () => {
    it('junta as páginas na ordem, sem repetir consulta', () => {
        const pages = [
            page(1, 2, ['5', '4', '3']),
            page(2, 2, ['3', '2', '1']),
        ];
        expect(flattenHistoryPages(pages).map((i) => i.id)).toEqual([
            '5',
            '4',
            '3',
            '2',
            '1',
        ]);
    });

    it('sem acesso, a lista fica vazia', () => {
        expect(flattenHistoryPages([null])).toEqual([]);
    });
});
