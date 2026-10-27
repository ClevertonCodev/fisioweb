import { render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import type { ProgramExercise, ProgramGroup } from '@/domain/clinic';
import { useProgramBuilder } from '@/pages/clinic/program/program-builder-prototype/builder';
import { GroupBoard } from '@/pages/clinic/program/program-builder-prototype/GroupBoard';

function exercise(overrides: Partial<ProgramExercise>): ProgramExercise {
    return {
        id: 'e1',
        exerciseId: '100',
        title: 'Ponte Glútea',
        thumbnailUrl: '',
        videoUrl: '',
        days: [],
        period: 'manha',
        seriesMin: null,
        seriesMax: null,
        repetitionsMin: null,
        repetitionsMax: null,
        loadMin: null,
        loadMax: null,
        restTime: null,
        notes: null,
        isConfigured: false,
        ...overrides,
    };
}

const GROUPS: ProgramGroup[] = [
    {
        id: 'g1',
        name: 'Principal',
        exercises: [
            exercise({ id: 'sem-dose', title: 'Ponte Glútea' }),
            exercise({
                id: 'com-dose',
                title: 'Bird Dog',
                seriesMin: 3,
                isConfigured: true,
            }),
        ],
    },
];

function Board() {
    const builder = useProgramBuilder(GROUPS);
    return (
        <GroupBoard
            builder={builder}
            onDose={vi.fn()}
            onAddExercises={vi.fn()}
        />
    );
}

function rowOf(title: string): HTMLElement {
    return screen.getByText(title).closest('button') as HTMLElement;
}

describe('GroupBoard do assistente (protótipo)', () => {
    beforeAll(() => {
        global.ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    });

    it('exercício sem dose mostra só "Sem dose", sem agenda', () => {
        render(<Board />);

        const row = rowOf('Ponte Glútea');
        expect(within(row).getByText(/Sem dose/)).toBeInTheDocument();
        expect(within(row).queryByText(/Todos os dias/)).toBeNull();
    });

    it('exercício com dose e sem dias marcados mostra "Todos os dias · Manhã"', () => {
        render(<Board />);

        expect(
            within(rowOf('Bird Dog')).getByText('Todos os dias · Manhã'),
        ).toBeInTheDocument();
    });
});
