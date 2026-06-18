import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { ExerciseFilters } from '@/components/clinic/ExerciseFilters';
import type {
    FilterCategory,
    ExerciseFilters as Filters,
} from '@/domain/clinic';

class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
}

beforeAll(() => {
    global.ResizeObserver = ResizeObserverStub;
});

const emptyFilters: Filters = {
    search: '',
    specialty: [],
    bodyArea: [],
    bodyRegion: [],
    objective: [],
    difficulty: [],
    muscleGroup: [],
    equipment: [],
    movementType: [],
    movementPattern: [],
    movementForm: [],
};

function makeCategory(
    id: keyof Omit<Filters, 'search'>,
    label: string,
    options: string[],
): FilterCategory {
    return {
        id,
        label,
        options: options.map((o) => ({ value: o, label: o })),
    };
}

const specialtyCategory = makeCategory('specialty', 'Especialidade', [
    'Traumato-Ortopédica',
    'Neurofuncional',
    'Esportiva',
]);

describe('ExerciseFilters — renderização', () => {
    it('exibe o título "Filtros"', () => {
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
            />,
        );
        expect(screen.getByText('Filtros')).toBeInTheDocument();
    });

    it('exibe o label de cada categoria', () => {
        const categories = [
            makeCategory('specialty', 'Especialidade', ['Traumato-Ortopédica']),
            makeCategory('difficulty', 'Dificuldade', ['Fácil']),
        ];
        render(
            <ExerciseFilters
                categories={categories}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
            />,
        );
        expect(screen.getByText('Especialidade')).toBeInTheDocument();
        expect(screen.getByText('Dificuldade')).toBeInTheDocument();
    });

    it('não renderiza o botão X quando onClose não é passado', () => {
        render(
            <ExerciseFilters
                categories={[]}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
            />,
        );
        expect(
            screen.queryByRole('button', { name: /fechar/i }),
        ).not.toBeInTheDocument();
    });

    it('renderiza e aciona o botão X quando onClose é passado', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        render(
            <ExerciseFilters
                categories={[]}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
                onClose={onClose}
            />,
        );
        const buttons = screen.getAllByRole('button');
        const xButton = buttons.find((b) => !b.textContent?.trim());
        await user.click(xButton!);
        expect(onClose).toHaveBeenCalledOnce();
    });
});

describe('ExerciseFilters — expandir/recolher categorias', () => {
    it('as opções não ficam visíveis antes de expandir a categoria', () => {
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
            />,
        );
        expect(
            screen.queryByText('Traumato-Ortopédica'),
        ).not.toBeInTheDocument();
    });

    it('exibe as opções após clicar no trigger da categoria', async () => {
        const user = userEvent.setup();
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
            />,
        );
        await user.click(screen.getByText('Especialidade'));
        expect(screen.getByText('Traumato-Ortopédica')).toBeInTheDocument();
        expect(screen.getByText('Neurofuncional')).toBeInTheDocument();
    });
});

describe('ExerciseFilters — interação com checkboxes', () => {
    it('chama onFiltersChange adicionando o valor ao clicar numa opção desmarcada', async () => {
        const user = userEvent.setup();
        const onFiltersChange = vi.fn();
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={emptyFilters}
                onFiltersChange={onFiltersChange}
            />,
        );
        await user.click(screen.getByText('Especialidade'));
        await user.click(screen.getByText('Traumato-Ortopédica'));
        expect(onFiltersChange).toHaveBeenCalledWith({
            ...emptyFilters,
            specialty: ['Traumato-Ortopédica'],
        });
    });

    it('chama onFiltersChange removendo o valor ao clicar numa opção marcada', async () => {
        const user = userEvent.setup();
        const onFiltersChange = vi.fn();
        const filtersWithSpecialty = {
            ...emptyFilters,
            specialty: ['Traumato-Ortopédica'],
        };
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={filtersWithSpecialty}
                onFiltersChange={onFiltersChange}
            />,
        );
        await user.click(screen.getByText('Especialidade'));
        await user.click(screen.getByText('Traumato-Ortopédica'));
        expect(onFiltersChange).toHaveBeenCalledWith({
            ...emptyFilters,
            specialty: [],
        });
    });
});

describe('ExerciseFilters — busca interna', () => {
    it('filtra as opções ao digitar no campo de busca', async () => {
        const user = userEvent.setup();
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
            />,
        );
        await user.click(screen.getByText('Especialidade'));
        expect(screen.getByText('Neurofuncional')).toBeInTheDocument();

        await user.type(
            screen.getByPlaceholderText(/pesquisar filtro/i),
            'Neuro',
        );
        expect(screen.getByText('Neurofuncional')).toBeInTheDocument();
        expect(
            screen.queryByText('Traumato-Ortopédica'),
        ).not.toBeInTheDocument();
    });

    it('oculta a categoria inteira quando nenhuma opção bate com a busca', async () => {
        const user = userEvent.setup();
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
            />,
        );
        await user.type(
            screen.getByPlaceholderText(/pesquisar filtro/i),
            'xyz',
        );
        expect(screen.queryByText('Especialidade')).not.toBeInTheDocument();
    });
});

describe('ExerciseFilters — botão Limpar filtros', () => {
    it('está desabilitado quando não há filtros ativos', () => {
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
            />,
        );
        expect(
            screen.getByRole('button', { name: /limpar filtros/i }),
        ).toBeDisabled();
    });

    it('está habilitado quando há filtros ativos', () => {
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={{
                    ...emptyFilters,
                    specialty: ['Traumato-Ortopédica'],
                }}
                onFiltersChange={vi.fn()}
            />,
        );
        expect(
            screen.getByRole('button', { name: /limpar filtros/i }),
        ).not.toBeDisabled();
    });

    it('chama onFiltersChange com todos os filtros zerados ao clicar', async () => {
        const user = userEvent.setup();
        const onFiltersChange = vi.fn();
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={{
                    ...emptyFilters,
                    specialty: ['Traumato-Ortopédica'],
                }}
                onFiltersChange={onFiltersChange}
            />,
        );
        await user.click(
            screen.getByRole('button', { name: /limpar filtros/i }),
        );
        expect(onFiltersChange).toHaveBeenCalledWith(emptyFilters);
    });
});

describe('ExerciseFilters — badge de contagem por categoria', () => {
    it('exibe o número de filtros ativos na categoria', () => {
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={{
                    ...emptyFilters,
                    specialty: ['Traumato-Ortopédica', 'Neurofuncional'],
                }}
                onFiltersChange={vi.fn()}
            />,
        );
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('não exibe badge quando a categoria não tem filtros selecionados', () => {
        render(
            <ExerciseFilters
                categories={[specialtyCategory]}
                filters={emptyFilters}
                onFiltersChange={vi.fn()}
            />,
        );
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });
});
