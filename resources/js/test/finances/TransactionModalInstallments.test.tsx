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

function installment(index: number): FinancialTransaction {
    return existing({
        id: String(40 + index),
        date: '2027-04-30',
        description: `Maca (${index}/10)`,
        type: 'saida',
        status: 'pendente',
        category: {
            id: '10',
            name: 'Aluguel',
            type: 'saida',
            origin: 'system',
            active: true,
            displayOrder: 1,
        },
        grossAmount: 300,
        series: { id: '7', kind: 'installments', index, total: 10 },
    });
}

describe('Modal de lançamento: parcelado', () => {
    it('parcelado mostra o valor de cada parcela e manda o repeat no POST', async () => {
        breakdown = [
            {
                category_id: 10,
                name: 'Aluguel',
                type: 'saida',
                count: 1,
                total: 1,
                percentage: 100,
            },
        ];
        api.post.mockResolvedValue({
            data: { data: savedTransaction({ type: 'saida' }) },
        });
        const user = userEvent.setup();
        const { onClose } = renderModal({ type: 'saida' });

        await fillBasics(user, { amount: '10000', description: 'Maca' });
        await user.click(
            await screen.findByRole('button', { name: 'Aluguel' }),
        );
        const repeat = screen.getByRole('radiogroup', { name: 'Repetir' });
        expect(
            within(repeat).getByRole('radio', { name: 'Não repete' }),
        ).toHaveAttribute('aria-checked', 'true');

        await user.click(
            within(repeat).getByRole('radio', { name: 'Parcelado' }),
        );
        const count = screen.getByLabelText('Número de parcelas');
        await user.clear(count);
        await user.type(count, '3');

        const preview = screen.getByTestId('installment-preview');
        expect(preview).toHaveTextContent(/3x de R\$\s33,33/);
        expect(preview).toHaveTextContent(/1ª de R\$\s33,34/);

        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        await waitFor(() =>
            expect(api.post).toHaveBeenCalledWith(
                '/clinic/finances/transactions',
                expect.objectContaining({
                    description: 'Maca',
                    gross_amount: 100,
                    status: 'pago',
                    repeat: { kind: 'installments', total: 3 },
                }),
            ),
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('parcelas fora de 2 a 48 mostram o erro no campo e não chamam a API', async () => {
        const user = userEvent.setup();
        renderModal({ type: 'saida' });

        await user.click(screen.getByRole('radio', { name: 'Parcelado' }));
        const count = screen.getByLabelText('Número de parcelas');
        await user.clear(count);
        await user.type(count, '60');
        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        expect(
            await screen.findByText('Informe de 2 a 48 parcelas.'),
        ).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled();
    });

    it('o 422 de repeat.total aparece no campo de parcelas', async () => {
        breakdown = [
            {
                category_id: 10,
                name: 'Aluguel',
                type: 'saida',
                count: 1,
                total: 1,
                percentage: 100,
            },
        ];
        api.post.mockRejectedValue(
            validation({ 'repeat.total': ['Use de 2 a 48 parcelas.'] }),
        );
        const user = userEvent.setup();
        const { onClose } = renderModal({ type: 'saida' });

        await fillBasics(user, { amount: '10000', description: 'Maca' });
        await user.click(
            await screen.findByRole('button', { name: 'Aluguel' }),
        );
        await user.click(screen.getByRole('radio', { name: 'Parcelado' }));
        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        const count = screen.getByLabelText('Número de parcelas');
        await waitFor(() =>
            expect(count).toHaveAttribute('aria-invalid', 'true'),
        );
        expect(count).toHaveAccessibleDescription('Use de 2 a 48 parcelas.');
        expect(onClose).not.toHaveBeenCalled();
    });

    it('editar não mostra o Repetir', () => {
        renderModal({ type: 'saida', editing: installment(4) });

        expect(
            screen.queryByRole('radiogroup', { name: 'Repetir' }),
        ).not.toBeInTheDocument();
    });

    it('salvar uma parcela pergunta "Só esta / Esta e as próximas" e manda o scope', async () => {
        api.put.mockResolvedValue({
            data: { data: savedTransaction({ id: 44, type: 'saida' }) },
        });
        const user = userEvent.setup();
        const { onClose } = renderModal({
            type: 'saida',
            editing: installment(4),
        });

        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        const ask = await screen.findByRole('dialog', {
            name: 'Alterar a parcela 4/10',
        });
        expect(api.put).not.toHaveBeenCalled();
        await user.click(
            within(ask).getByRole('button', { name: 'Esta e as próximas' }),
        );

        await waitFor(() =>
            expect(api.put).toHaveBeenCalledWith(
                '/clinic/finances/transactions/44',
                expect.objectContaining({
                    description: 'Maca (4/10)',
                    scope: 'following',
                }),
            ),
        );
        expect(api.put.mock.calls[0][1]).not.toHaveProperty('repeat');
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('"Só esta" manda scope only', async () => {
        api.put.mockResolvedValue({
            data: { data: savedTransaction({ id: 44, type: 'saida' }) },
        });
        const user = userEvent.setup();
        renderModal({ type: 'saida', editing: installment(4) });

        await user.click(screen.getByRole('button', { name: 'Salvar' }));
        const ask = await screen.findByRole('dialog', {
            name: 'Alterar a parcela 4/10',
        });
        await user.click(within(ask).getByRole('button', { name: 'Só esta' }));

        await waitFor(() =>
            expect(api.put).toHaveBeenCalledWith(
                '/clinic/finances/transactions/44',
                expect.objectContaining({ scope: 'only' }),
            ),
        );
    });

    it('excluir uma parcela pergunta "Só esta / Esta e as próximas"', async () => {
        api.delete.mockResolvedValue({ data: null });
        const user = userEvent.setup();
        const { onClose } = renderModal({
            type: 'saida',
            editing: installment(4),
        });

        await user.click(screen.getByRole('button', { name: 'Excluir' }));
        const confirm = await screen.findByRole('dialog', {
            name: 'Excluir a parcela 4/10?',
        });
        expect(confirm).toHaveTextContent(/pendentes/);
        await user.click(
            within(confirm).getByRole('button', { name: 'Esta e as próximas' }),
        );

        await waitFor(() =>
            expect(api.delete).toHaveBeenCalledWith(
                '/clinic/finances/transactions/44',
                { params: { scope: 'following' } },
            ),
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('excluir "Só esta" manda scope only', async () => {
        api.delete.mockResolvedValue({ data: null });
        const user = userEvent.setup();
        renderModal({ type: 'saida', editing: installment(4) });

        await user.click(screen.getByRole('button', { name: 'Excluir' }));
        const confirm = await screen.findByRole('dialog', {
            name: 'Excluir a parcela 4/10?',
        });
        await user.click(
            within(confirm).getByRole('button', { name: 'Só esta' }),
        );

        await waitFor(() =>
            expect(api.delete).toHaveBeenCalledWith(
                '/clinic/finances/transactions/44',
                { params: { scope: 'only' } },
            ),
        );
    });
});
