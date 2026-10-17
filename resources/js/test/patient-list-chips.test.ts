import { describe, expect, it } from 'vitest';

import {
    DEFAULT_PATIENT_LIST_FILTERS,
    type PatientListFilters,
} from '@/application/clinic/patient-list-filters';
import {
    activePatientFilterCount,
    clearedPatientListFilters,
    patientListChips,
    removePatientListChip,
} from '@/pages/clinic/patient/patient-list/patient-list-chips';

const PROFESSIONALS = [
    { id: '3', name: 'Dra. Ana Paula Souza' },
    { id: '9', name: 'Prof. Bruno Lima' },
    { id: '11', name: 'Carla' },
];

function filters(patch: Partial<PatientListFilters>): PatientListFilters {
    return { ...DEFAULT_PATIENT_LIST_FILTERS, ...patch };
}

function chipTexts(f: PatientListFilters) {
    return patientListChips(f, PROFESSIONALS).map(
        (c) => `${c.label}: ${c.value}`,
    );
}

describe('patientListChips', () => {
    it('sem filtros não há chips', () => {
        expect(chipTexts(DEFAULT_PATIENT_LIST_FILTERS)).toEqual([]);
    });

    it('um chip por filtro, na ordem cadastro, situação, status, profissionais e itens por página', () => {
        expect(
            chipTexts(
                filters({
                    perPage: 32,
                    professionalIds: ['3'],
                    statuses: ['alta', 'em_tratamento'],
                    situation: 'inativos',
                    dateFrom: '2026-01-05',
                    dateTo: '2026-03-31',
                }),
            ),
        ).toEqual([
            'Cadastro: 05/01/2026 – 31/03/2026',
            'Situação: Só inativos',
            'Status: Alta',
            'Status: Em tratamento',
            'Profissional: Ana',
            'Itens por página: 32',
        ]);
    });

    it('cadastro só com a data inicial', () => {
        expect(chipTexts(filters({ dateFrom: '2026-01-05' }))).toEqual([
            'Cadastro: a partir de 05/01/2026',
        ]);
    });

    it('vários profissionais num chip só, com o primeiro nome sem título', () => {
        expect(
            chipTexts(filters({ professionalIds: ['3', '9', '11'] })),
        ).toEqual(['Profissionais: Ana, Bruno, Carla']);
    });

    it('profissional que não está na lista aparece pelo id', () => {
        expect(chipTexts(filters({ professionalIds: ['77'] }))).toEqual([
            'Profissional: #77',
        ]);
    });

    it('a situação padrão (ativos e inativos) não vira chip', () => {
        expect(chipTexts(filters({ situation: 'todos' }))).toEqual([]);
    });
});

describe('removePatientListChip', () => {
    const all = filters({
        perPage: 32,
        professionalIds: ['3', '9'],
        statuses: ['alta', 'obito'],
        situation: 'ativos',
        dateFrom: '2026-01-05',
        dateTo: '2026-03-31',
    });

    function remove(key: string) {
        const chip = patientListChips(all, PROFESSIONALS).find(
            (c) => c.key === key,
        );
        expect(chip).toBeDefined();
        return { ...all, ...removePatientListChip(all, chip!) };
    }

    it('remover um status tira só aquele status', () => {
        expect(remove('status:alta')).toEqual({ ...all, statuses: ['obito'] });
    });

    it('remover o chip de profissionais tira todos os profissionais', () => {
        expect(remove('prof')).toEqual({ ...all, professionalIds: [] });
    });

    it('remover o cadastro limpa as duas datas', () => {
        expect(remove('range')).toEqual({
            ...all,
            dateFrom: null,
            dateTo: null,
        });
    });

    it('remover a situação volta para ativos e inativos', () => {
        expect(remove('situation')).toEqual({ ...all, situation: 'todos' });
    });

    it('remover itens por página volta para 16', () => {
        expect(remove('perPage')).toEqual({ ...all, perPage: 16 });
    });
});

describe('clearedPatientListFilters e activePatientFilterCount', () => {
    it('Limpar zera filtros e itens por página, mas mantém a busca', () => {
        const all = filters({
            search: 'ana',
            perPage: 50,
            professionalIds: ['3'],
            statuses: ['alta'],
            situation: 'inativos',
            dateFrom: '2026-01-05',
        });
        expect({ ...all, ...clearedPatientListFilters() }).toEqual({
            ...DEFAULT_PATIENT_LIST_FILTERS,
            search: 'ana',
        });
    });

    it('conta os filtros ligados (itens por página e busca não contam)', () => {
        expect(activePatientFilterCount(DEFAULT_PATIENT_LIST_FILTERS)).toBe(0);
        expect(
            activePatientFilterCount(
                filters({
                    search: 'ana',
                    perPage: 50,
                    statuses: ['alta', 'obito'],
                    professionalIds: ['3', '9'],
                    situation: 'ativos',
                    dateFrom: '2026-01-05',
                }),
            ),
        ).toBe(6);
    });
});
