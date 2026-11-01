import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FinancialTransaction } from '@/domain/clinic/finance';
import {
    TransactionModal,
    type Draft,
} from '@/pages/clinic/finances/TransactionModal';

const api = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
}));

vi.mock('@/infrastructure/api/client', () => ({ apiClient: api }));

const CATEGORIES = [
    {
        id: 1,
        name: 'Sessões',
        type: 'entrada',
        origin: 'system',
        active: true,
        display_order: 1,
    },
    {
        id: 2,
        name: 'Avaliação',
        type: 'entrada',
        origin: 'system',
        active: true,
        display_order: 2,
    },
    {
        id: 3,
        name: 'Pilates',
        type: 'entrada',
        origin: 'custom',
        active: true,
        display_order: 3,
    },
    {
        id: 4,
        name: 'Desligada',
        type: 'entrada',
        origin: 'custom',
        active: false,
        display_order: 4,
    },
    {
        id: 10,
        name: 'Aluguel',
        type: 'saida',
        origin: 'system',
        active: true,
        display_order: 1,
    },
    {
        id: 11,
        name: 'Material',
        type: 'saida',
        origin: 'system',
        active: true,
        display_order: 2,
    },
];

let breakdown: Array<{
    category_id: number;
    name: string;
    type: string;
    count: number;
    total: number;
    percentage: number;
}> = [];

function savedTransaction(overrides: Record<string, unknown> = {}) {
    return {
        id: 99,
        date: '2026-10-15',
        description: 'Sessão — Maria',
        category: CATEGORIES[0],
        type: 'entrada',
        status: 'recebido',
        payment_method: 'cartao_credito',
        gross_amount: '100.00',
        fee_amount: '3.00',
        net_amount: '97.00',
        ...overrides,
    };
}

function existing(
    overrides: Partial<FinancialTransaction> = {},
): FinancialTransaction {
    return {
        id: '42',
        date: '2026-10-10',
        description: 'Sessão — João',
        category: {
            id: '1',
            name: 'Sessões',
            type: 'entrada',
            origin: 'system',
            active: true,
            displayOrder: 1,
        },
        type: 'entrada',
        status: 'recebido',
        paymentMethod: 'pix',
        grossAmount: 150,
        feeAmount: 0,
        netAmount: 150,
        notes: null,
        ...overrides,
    };
}

function renderModal(draft: Draft, onClose = vi.fn()) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    render(
        <QueryClientProvider client={client}>
            <TransactionModal
                draft={draft}
                period="2026-10"
                onClose={onClose}
            />
        </QueryClientProvider>,
    );
    return { onClose, invalidate };
}

function validation(errors: Record<string, string[]>, message = 'Erro.') {
    return Object.assign(new Error('422'), {
        response: { status: 422, data: { message, errors } },
    });
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15, 12, 0));
    breakdown = [];
    api.get.mockReset();
    api.post.mockReset();
    api.put.mockReset();
    api.delete.mockReset();
    api.get.mockImplementation(
        async (url: string, config?: { params?: Record<string, unknown> }) => {
            if (url === '/clinic/finances/categories') {
                const type = config?.params?.type;
                return {
                    data: {
                        data: CATEGORIES.filter(
                            (c) => c.active && (!type || c.type === type),
                        ),
                    },
                };
            }
            if (url === '/clinic/finances/reports/category-breakdown') {
                return { data: { data: breakdown } };
            }
            throw new Error(`GET inesperado: ${url}`);
        },
    );
});

async function fillBasics(
    user: ReturnType<typeof userEvent.setup>,
    { amount = '10000', description = 'Sessão — Maria' } = {},
) {
    await user.type(screen.getByLabelText('Valor'), amount);
    await user.type(screen.getByLabelText('Descrição'), description);
}

describe('Modal de lançamento', () => {
    it('lança uma entrada com taxa de 3%: manda fee_amount = 3 e mostra o líquido R$ 97,00', async () => {
        breakdown = [
            {
                category_id: 1,
                name: 'Sessões',
                type: 'entrada',
                count: 5,
                total: 500,
                percentage: 80,
            },
        ];
        api.post.mockResolvedValue({ data: { data: savedTransaction() } });
        const user = userEvent.setup();
        const { onClose, invalidate } = renderModal({ type: 'entrada' });

        await fillBasics(user);
        await user.click(
            await screen.findByRole('button', { name: 'Sessões' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Cartão de crédito' }),
        );
        await user.click(screen.getByRole('radio', { name: '%' }));
        await user.type(screen.getByLabelText('Taxa da maquininha (%)'), '3');

        expect(screen.getByText(/R\$\s97,00/)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1));
        expect(api.post).toHaveBeenCalledWith('/clinic/finances/transactions', {
            date: '2026-10-15',
            description: 'Sessão — Maria',
            financial_category_id: 1,
            type: 'entrada',
            status: 'recebido',
            payment_method: 'cartao_credito',
            gross_amount: 100,
            fee_amount: 3,
            notes: null,
        });
        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['finance'] });
    });

    it('lança uma saída paga, sem taxa, pela lista de categorias', async () => {
        api.post.mockResolvedValue({
            data: { data: savedTransaction({ type: 'saida', status: 'pago' }) },
        });
        const user = userEvent.setup();
        const { onClose } = renderModal({ type: 'saida' });

        await fillBasics(user, {
            amount: '250000',
            description: 'Aluguel de outubro',
        });
        await user.click(screen.getByLabelText('Todas as categorias'));
        await user.click(
            await screen.findByRole('option', { name: 'Aluguel' }),
        );
        expect(
            screen.queryByLabelText('Taxa da maquininha'),
        ).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        await waitFor(() =>
            expect(api.post).toHaveBeenCalledWith(
                '/clinic/finances/transactions',
                {
                    date: '2026-10-15',
                    description: 'Aluguel de outubro',
                    financial_category_id: 10,
                    type: 'saida',
                    status: 'pago',
                    payment_method: 'pix',
                    gross_amount: 2500,
                    fee_amount: 0,
                    notes: null,
                },
            ),
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('sem valor, descrição ou categoria: mostra a mensagem no campo e não chama a API', async () => {
        const user = userEvent.setup();
        renderModal({ type: 'saida' });

        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        expect(await screen.findByText('Informe o valor.')).toBeInTheDocument();
        expect(screen.getByText('Descreva o lançamento.')).toBeInTheDocument();
        expect(screen.getByText('Escolha a categoria.')).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('taxa maior que o valor: o erro do servidor aparece no campo da taxa', async () => {
        breakdown = [
            {
                category_id: 1,
                name: 'Sessões',
                type: 'entrada',
                count: 1,
                total: 100,
                percentage: 100,
            },
        ];
        api.post.mockRejectedValue(
            validation({
                fee_amount: ['A taxa não pode ser maior que o valor.'],
            }),
        );
        const user = userEvent.setup();
        const { onClose } = renderModal({ type: 'entrada' });

        await fillBasics(user, { amount: '5000' });
        await user.click(
            await screen.findByRole('button', { name: 'Sessões' }),
        );
        await user.click(
            screen.getByRole('button', { name: 'Cartão de débito' }),
        );
        await user.type(screen.getByLabelText('Taxa da maquininha'), '6000');
        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        const fee = screen.getByLabelText('Taxa da maquininha');
        await waitFor(() =>
            expect(fee).toHaveAttribute('aria-invalid', 'true'),
        );
        expect(fee).toHaveAccessibleDescription(
            'A taxa não pode ser maior que o valor.',
        );
        expect(api.post).toHaveBeenCalledWith(
            '/clinic/finances/transactions',
            expect.objectContaining({ gross_amount: 50, fee_amount: 60 }),
        );
        expect(onClose).not.toHaveBeenCalled();
    });

    it('editar manda PUT com o que mudou e fecha', async () => {
        api.put.mockResolvedValue({
            data: {
                data: savedTransaction({
                    id: 42,
                    description: 'Sessão — João Silva',
                }),
            },
        });
        const user = userEvent.setup();
        const { onClose, invalidate } = renderModal({
            type: 'entrada',
            editing: existing(),
        });

        expect(
            screen.getByRole('heading', { name: 'Editar lançamento' }),
        ).toBeInTheDocument();
        const description = screen.getByLabelText('Descrição');
        await user.clear(description);
        await user.type(description, 'Sessão — João Silva');
        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1));
        expect(api.put).toHaveBeenCalledWith(
            '/clinic/finances/transactions/42',
            {
                date: '2026-10-10',
                description: 'Sessão — João Silva',
                financial_category_id: 1,
                type: 'entrada',
                status: 'recebido',
                payment_method: 'pix',
                gross_amount: 150,
                fee_amount: 0,
                notes: null,
            },
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['finance'] });
    });

    it('excluir pede confirmação e manda o lançamento para a lixeira', async () => {
        api.delete.mockResolvedValue({ data: null });
        const user = userEvent.setup();
        const { onClose, invalidate } = renderModal({
            type: 'entrada',
            editing: existing(),
        });

        await user.click(screen.getByRole('button', { name: 'Excluir' }));
        const confirm = await screen.findByRole('dialog', {
            name: 'Excluir este lançamento?',
        });
        expect(confirm).toHaveTextContent(/lixeira/);
        expect(api.delete).not.toHaveBeenCalled();

        await user.click(
            within(confirm).getByRole('button', { name: 'Excluir' }),
        );

        await waitFor(() =>
            expect(api.delete).toHaveBeenCalledWith(
                '/clinic/finances/transactions/42',
            ),
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['finance'] });
    });

    it('cancelar a confirmação não exclui', async () => {
        const user = userEvent.setup();
        const { onClose } = renderModal({
            type: 'entrada',
            editing: existing(),
        });

        await user.click(screen.getByRole('button', { name: 'Excluir' }));
        const confirm = await screen.findByRole('dialog', {
            name: 'Excluir este lançamento?',
        });
        await user.click(
            within(confirm).getByRole('button', { name: 'Cancelar' }),
        );

        await waitFor(() =>
            expect(
                screen.queryByRole('dialog', {
                    name: 'Excluir este lançamento?',
                }),
            ).not.toBeInTheDocument(),
        );
        expect(api.delete).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('as mais usadas vêm do category-breakdown do mês, do tipo certo e só as ligadas', async () => {
        breakdown = [
            {
                category_id: 4,
                name: 'Desligada',
                type: 'entrada',
                count: 9,
                total: 900,
                percentage: 50,
            },
            {
                category_id: 2,
                name: 'Avaliação',
                type: 'entrada',
                count: 2,
                total: 200,
                percentage: 20,
            },
            {
                category_id: 3,
                name: 'Pilates',
                type: 'entrada',
                count: 6,
                total: 600,
                percentage: 30,
            },
            {
                category_id: 11,
                name: 'Material',
                type: 'saida',
                count: 7,
                total: 70,
                percentage: 70,
            },
            {
                category_id: 10,
                name: 'Aluguel',
                type: 'saida',
                count: 1,
                total: 30,
                percentage: 30,
            },
        ];
        const user = userEvent.setup();
        renderModal({ type: 'saida' });

        const chips = await screen.findByRole('group', { name: 'Mais usadas' });
        expect(
            within(chips)
                .getAllByRole('button')
                .map((b) => b.textContent),
        ).toEqual(['Material', 'Aluguel']);
        expect(api.get).toHaveBeenCalledWith(
            '/clinic/finances/reports/category-breakdown',
            { params: { period: '2026-10', type: undefined } },
        );

        await user.click(screen.getByRole('radio', { name: 'Entrada' }));

        await waitFor(() =>
            expect(
                within(screen.getByRole('group', { name: 'Mais usadas' }))
                    .getAllByRole('button')
                    .map((b) => b.textContent),
            ).toEqual(['Pilates', 'Avaliação']),
        );
    });
});
