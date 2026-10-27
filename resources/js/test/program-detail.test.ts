import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    doseParts,
    programBackPath,
    programPanel,
    scheduleOf,
} from '@/application/clinic/program-detail';
import type { Program, ProgramExercise } from '@/domain/clinic';

function exercise(overrides: Partial<ProgramExercise> = {}): ProgramExercise {
    return {
        id: 'e1',
        exerciseId: '100',
        title: 'Ponte Glútea',
        thumbnailUrl: '',
        videoUrl: '',
        days: [],
        period: null,
        seriesMin: null,
        seriesMax: null,
        repetitionsMin: null,
        repetitionsMax: null,
        loadMin: null,
        loadMax: null,
        restTime: null,
        notes: null,
        isConfigured: true,
        ...overrides,
    };
}

describe('doseParts', () => {
    it('quebra a dose em séries, repetições (faixa), carga e descanso', () => {
        expect(
            doseParts(
                exercise({
                    seriesMin: 3,
                    seriesMax: 3,
                    repetitionsMin: 10,
                    repetitionsMax: 15,
                    loadMin: 2,
                    loadMax: 2,
                    restTime: 30,
                }),
            ),
        ).toEqual([
            { key: 'sets', value: '3', unit: 'séries' },
            { key: 'reps', value: '10–15', unit: 'repetições' },
            { key: 'load', value: '2', unit: 'kg' },
            { key: 'rest', value: '30 s', unit: 'de descanso' },
        ]);
    });

    it('usa o singular para 1 série e 1 repetição', () => {
        expect(
            doseParts(exercise({ seriesMin: 1, repetitionsMax: 1 })),
        ).toEqual([
            { key: 'sets', value: '1', unit: 'série' },
            { key: 'reps', value: '1', unit: 'repetição' },
        ]);
    });

    it('não mostra carga 0 nem descanso 0', () => {
        expect(
            doseParts(exercise({ seriesMin: 3, loadMin: 0, restTime: 0 })),
        ).toEqual([{ key: 'sets', value: '3', unit: 'séries' }]);
    });

    it('devolve lista vazia quando nada foi configurado', () => {
        expect(doseParts(exercise())).toEqual([]);
    });
});

describe('scheduleOf', () => {
    it('lista os dias em ordem e o período', () => {
        expect(scheduleOf(exercise({ days: [5, 1, 3], period: 'manha' }))).toBe(
            'Seg, Qua, Sex · Manhã',
        );
    });

    it('diz "Todos os dias" quando tem os sete dias', () => {
        expect(
            scheduleOf(exercise({ days: [0, 1, 2, 3, 4, 5, 6], period: null })),
        ).toBe('Todos os dias');
    });

    it('sem dias marcados é todo dia, com ou sem período', () => {
        expect(scheduleOf(exercise())).toBe('Todos os dias');
        expect(scheduleOf(exercise({ days: [], period: 'manha' }))).toBe(
            'Todos os dias · Manhã',
        );
    });
});

function program(overrides: Partial<Program> = {}): Program {
    return {
        id: '6',
        title: 'Prevenção de Quedas',
        patientId: '48',
        patientName: 'Paciente Teste',
        patientPhotoUrl: null,
        patientPhone: null,
        patientEmail: null,
        shareUrl: null,
        professionalId: '1',
        professionalName: 'Fisio Teste',
        professionalPhotoUrl: null,
        exerciseCount: 3,
        startDate: '2026-10-01',
        endDate: '2026-11-05',
        message: '',
        groups: [
            {
                id: 'g1',
                name: 'Principal',
                exercises: [exercise(), exercise({ id: 'e2' })],
            },
            {
                id: 'g2',
                name: 'Alongamento',
                exercises: [exercise({ id: 'e3' })],
            },
        ],
        status: 'active',
        patientViewedAt: '2026-10-20T13:00:00',
        patientCompletedCount: 4,
        createdAt: '2026-10-01T00:00:00Z',
        ...overrides,
    };
}

describe('programPanel', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date(2026, 9, 26, 10, 0, 0));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('programa enviado tem os quatro números: exercícios, faltam, completou e abriu', () => {
        const panel = programPanel(program());

        expect(panel.isDraft).toBe(false);
        expect(panel.stats).toEqual([
            { key: 'exercises', label: 'Exercícios', value: '3' },
            { key: 'validity', label: 'Faltam', value: '10 dias' },
            { key: 'completed', label: 'Vezes que completou', value: '4' },
            { key: 'viewed', label: 'Paciente abriu', value: '20/10/26' },
        ]);
    });

    it.each([
        ['2026-10-14', 'Terminou há', '12 dias'],
        ['2026-10-25', 'Terminou há', '1 dia'],
        ['2026-10-26', 'Termina', 'Hoje'],
        ['2026-10-27', 'Faltam', '1 dia'],
        [null, 'Término', 'Sem fim'],
    ])('validade com fim %s mostra "%s %s"', (endDate, label, value) => {
        const stat = programPanel(program({ endDate })).stats.find(
            (s) => s.key === 'validity',
        );

        expect(stat).toEqual({ key: 'validity', label, value });
    });

    it('mostra "Ainda não" quando o paciente não abriu o programa', () => {
        const stat = programPanel(
            program({ patientViewedAt: null }),
        ).stats.find((s) => s.key === 'viewed');

        expect(stat?.value).toBe('Ainda não');
    });

    it('rascunho fica só com o número de exercícios e marca o aviso', () => {
        const panel = programPanel(
            program({ status: 'draft', patientViewedAt: null }),
        );

        expect(panel.isDraft).toBe(true);
        expect(panel.stats).toEqual([
            { key: 'exercises', label: 'Exercícios', value: '3' },
        ]);
    });
});

describe('programBackPath', () => {
    it('volta para a origem dentro da clínica, com a busca', () => {
        expect(
            programBackPath({
                from: '/clinica/programas/historico?patientId=48',
            }),
        ).toBe('/clinica/programas/historico?patientId=48');
        expect(programBackPath({ from: '/clinica/pacientes/48' })).toBe(
            '/clinica/pacientes/48',
        );
    });

    it.each([
        ['sem state', null],
        ['state sem from', {}],
        ['from que não é texto', { from: 42 }],
        ['outra área', { from: '/admin/clinicas' }],
        ['URL externa', { from: 'https://exemplo.test/clinica/x' }],
        ['protocolo relativo', { from: '//exemplo.test/clinica/x' }],
    ])('cai no Histórico com %s', (_caso, state) => {
        expect(programBackPath(state)).toBe('/clinica/programas/historico');
    });
});
