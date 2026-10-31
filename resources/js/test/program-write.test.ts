import { describe, expect, it } from 'vitest';

import { buildProgramWriteDto } from '@/application/clinic/program-write';
import type { ProgramExercise, ProgramGroup } from '@/domain/clinic';

function exercise(overrides: Partial<ProgramExercise>): ProgramExercise {
    return {
        id: 'local-1',
        exerciseId: '100',
        title: 'Ponte',
        thumbnailUrl: '',
        videoUrl: '',
        days: [1, 3],
        period: 'manha',
        seriesMin: 3,
        seriesMax: 3,
        repetitionsMin: 12,
        repetitionsMax: 12,
        loadMin: null,
        loadMax: null,
        restTime: 45,
        notes: null,
        isConfigured: true,
        ...overrides,
    };
}

const GROUPS: ProgramGroup[] = [
    {
        id: '7',
        name: 'Aquecimento',
        exercises: [exercise({ id: '70', exerciseId: '100' })],
    },
    {
        id: 'grupo-novo',
        name: 'Principal',
        exercises: [
            exercise({ id: '71', exerciseId: '200', period: 'noite' }),
            exercise({ id: '71-copia', exerciseId: '200' }),
        ],
    },
];

const DETAILS = {
    title: 'Joelho',
    patientId: '15',
    message: 'Bom treino',
    startDate: '2026-11-01',
    endDate: null,
};

describe('buildProgramWriteDto', () => {
    it('manda grupos e exercícios na ordem, sem status', () => {
        const dto = buildProgramWriteDto({ details: DETAILS, groups: GROUPS });

        expect(dto).not.toHaveProperty('status');
        expect(dto).toMatchObject({
            title: 'Joelho',
            patientId: 15,
            message: 'Bom treino',
            startDate: '2026-11-01',
            endDate: null,
            groups: [
                { name: 'Aquecimento', sortOrder: 0 },
                { name: 'Principal', sortOrder: 1 },
            ],
        });
        expect(
            dto.exercises.map((e) => [e.exerciseId, e.groupIndex, e.period]),
        ).toEqual([
            [100, 0, 'manha'],
            [200, 1, 'noite'],
            [200, 1, 'manha'],
        ]);
        expect(dto.exercises[0]).toMatchObject({
            days: [1, 3],
            setsMin: 3,
            repetitionsMax: 12,
            restTime: 45,
        });
    });

    it('sem ids salvos, nada leva id (programa novo)', () => {
        const dto = buildProgramWriteDto({ details: DETAILS, groups: GROUPS });

        expect(dto.groups.every((g) => g.id === undefined)).toBe(true);
        expect(dto.exercises.every((e) => e.id === undefined)).toBe(true);
    });

    it('na edição, só o que já estava salvo leva o id', () => {
        const dto = buildProgramWriteDto({
            details: DETAILS,
            groups: GROUPS,
            saved: { groupIds: ['7'], exerciseIds: ['70', '71'] },
        });

        expect(dto.groups.map((g) => g.id)).toEqual([7, undefined]);
        expect(dto.exercises.map((e) => e.id)).toEqual([70, 71, undefined]);
    });

    it('modelo vai sem paciente e sem datas', () => {
        const dto = buildProgramWriteDto({
            details: DETAILS,
            groups: GROUPS,
            asModel: true,
        });

        expect(dto).toMatchObject({
            patientId: null,
            startDate: null,
            endDate: null,
        });
    });

    it('paciente vazio vira null (tirar o paciente na edição)', () => {
        const dto = buildProgramWriteDto({
            details: { ...DETAILS, patientId: '' },
            groups: GROUPS,
        });

        expect(dto.patientId).toBeNull();
    });
});

describe('toDateOnly', () => {
    it('usa o dia local, sem virar o dia anterior no fuso de Brasília', async () => {
        const { toDateOnly } = await import('@/application/clinic/dates');
        expect(toDateOnly(new Date(2026, 10, 1, 23, 30))).toBe('2026-11-01');
        expect(toDateOnly(null)).toBeNull();
    });
});
