import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FinancialCategory } from '@/domain/clinic/finance';
import { FinanceCategoriesSection } from '@/pages/clinic/finances/FinanceCategoriesSection';

const auth = vi.hoisted(() => ({ role: 'admin' as string }));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Ana', type: 'clinic', role: auth.role },
        token: 'fake',
        login: vi.fn(),
        logout: vi.fn(),
        guard: 'clinic',
    }),
}));

const toast = vi.hoisted(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
}));
vi.mock('sonner', () => ({ toast }));

const repo = vi.hoisted(() => ({
    list: vi.fn(),
    create: vi.fn(),
    toggleActive: vi.fn(),
    remove: vi.fn(),
}));
vi.mock('@/infrastructure/repositories/api-clinic-finance-categories', () => ({
    apiClinicFinanceCategoriesRepository: repo,
}));

function category(overrides: Partial<FinancialCategory>): FinancialCategory {
    return {
        id: '1',
        name: 'Sessão avulsa',
        type: 'entrada',
        origin: 'system',
        active: true,
        displayOrder: 1,
        ...overrides,
    };
}

const CATEGORIES: FinancialCategory[] = [
    category({ id: '1', name: 'Sessão avulsa' }),
    category({ id: '2', name: 'Convênio', active: false, displayOrder: 2 }),
    category({ id: '3', name: 'Pilates', origin: 'custom' }),
    category({ id: '4', name: 'Aluguel', type: 'saida' }),
];

function renderSection() {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={client}>
            <FinanceCategoriesSection />
        </QueryClientProvider>,
    );
}

function column(name: 'Entradas' | 'Saídas') {
    return screen.getByRole('region', { name });
}

beforeEach(() => {
    auth.role = 'admin';
    vi.clearAllMocks();
    repo.list.mockResolvedValue(CATEGORIES);
});

describe('FinanceCategoriesSection', () => {
    it('mostra as colunas com as da clínica e as do sistema, e quantas estão ligadas', async () => {
        renderSection();

        await screen.findByText('Pilates');
        const entradas = column('Entradas');
        expect(within(entradas).getByText('Pilates')).toBeInTheDocument();
        expect(within(entradas).getByText('Convênio')).toBeInTheDocument();
        expect(
            within(entradas).getByText('2 de 3 ligadas'),
        ).toBeInTheDocument();
        expect(
            within(column('Saídas')).getByText('1 de 1 ligadas'),
        ).toBeInTheDocument();
        expect(repo.list).toHaveBeenCalledWith(undefined, {
            includeInactive: true,
        });
    });

    it('categoria do sistema não tem botão de excluir; a da clínica tem', async () => {
        renderSection();

        await screen.findByText('Pilates');
        expect(
            screen.getByRole('button', { name: 'Excluir Pilates' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Excluir Sessão avulsa' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Excluir Aluguel' }),
        ).not.toBeInTheDocument();
    });

    it('cria categoria da clínica na coluna certa e recarrega a lista', async () => {
        const user = userEvent.setup();
        repo.create.mockResolvedValue(
            category({ id: '9', name: 'Pilates em grupo', origin: 'custom' }),
        );
        renderSection();
        await screen.findByText('Pilates');

        await user.type(
            screen.getByRole('textbox', { name: 'Nova categoria de entrada' }),
            '  Pilates em grupo ',
        );
        await user.click(
            within(column('Entradas')).getByRole('button', { name: 'Criar' }),
        );

        await waitFor(() =>
            expect(repo.create).toHaveBeenCalledWith(
                'Pilates em grupo',
                'entrada',
            ),
        );
        await waitFor(() => expect(repo.list).toHaveBeenCalledTimes(2));
        expect(
            screen.getByRole('textbox', { name: 'Nova categoria de entrada' }),
        ).toHaveValue('');
    });

    it('liga e desliga qualquer categoria, também a do sistema', async () => {
        const user = userEvent.setup();
        repo.toggleActive.mockResolvedValue(undefined);
        renderSection();
        await screen.findByText('Pilates');

        await user.click(
            screen.getByRole('switch', { name: /Desligar Sessão avulsa/ }),
        );
        await waitFor(() =>
            expect(repo.toggleActive).toHaveBeenCalledWith('1'),
        );
        expect(toast.success).toHaveBeenCalledWith(
            '"Sessão avulsa" desligada.',
        );

        await user.click(
            screen.getByRole('switch', { name: /Ligar Convênio/ }),
        );
        await waitFor(() =>
            expect(repo.toggleActive).toHaveBeenCalledWith('2'),
        );
        await waitFor(() => expect(repo.list).toHaveBeenCalledTimes(3));
    });

    it('exclui a categoria da clínica', async () => {
        const user = userEvent.setup();
        repo.remove.mockResolvedValue(undefined);
        renderSection();
        await screen.findByText('Pilates');

        await user.click(
            screen.getByRole('button', { name: 'Excluir Pilates' }),
        );

        await waitFor(() => expect(repo.remove).toHaveBeenCalledWith('3'));
        expect(toast.success).toHaveBeenCalledWith(
            'Categoria "Pilates" excluída.',
        );
    });

    it('com lançamentos, excluir mostra a mensagem do 409', async () => {
        const user = userEvent.setup();
        repo.remove.mockRejectedValue({
            response: {
                status: 409,
                data: {
                    message:
                        'Categoria possui transações; desative-a em vez de excluir.',
                },
            },
        });
        renderSection();
        await screen.findByText('Pilates');

        await user.click(
            screen.getByRole('button', { name: 'Excluir Pilates' }),
        );

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'Categoria possui transações; desative-a em vez de excluir.',
            ),
        );
        expect(toast.success).not.toHaveBeenCalled();
    });

    it.each(['secretary', 'physiotherapist'])(
        '%s não vê a seção nem busca as categorias',
        (role) => {
            auth.role = role;
            const { container } = renderSection();

            expect(container).toBeEmptyDOMElement();
            expect(repo.list).not.toHaveBeenCalled();
        },
    );
});
