import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const ALUGUEL = [
    {
        category_id: 10,
        name: 'Aluguel',
        type: 'saida',
        count: 1,
        total: 1,
        percentage: 100,
    },
];

async function fillRent(user: ReturnType<typeof userEvent.setup>) {
    await fillBasics(user, { amount: '250000', description: 'Aluguel' });
    await user.click(await screen.findByRole('button', { name: 'Aluguel' }));
}

describe('Modal de lançamento: recorrente', () => {
    it('recorrente mensal sem fim manda o repeat com a frequência e ends_on nulo', async () => {
        breakdown = ALUGUEL;
        api.post.mockResolvedValue({
            data: { data: savedTransaction({ type: 'saida' }) },
        });
        const user = userEvent.setup();
        const { onClose } = renderModal({ type: 'saida' });

        await fillRent(user);
        const repeat = screen.getByRole('radiogroup', { name: 'Repetir' });
        await user.click(
            within(repeat).getByRole('radio', { name: 'Recorrente' }),
        );

        const frequency = screen.getByRole('radiogroup', {
            name: 'Frequência',
        });
        expect(
            within(frequency).getByRole('radio', { name: 'Mensal' }),
        ).toHaveAttribute('aria-checked', 'true');
        const ends = screen.getByRole('radiogroup', { name: 'Termina' });
        expect(
            within(ends).getByRole('radio', { name: 'Sem data para acabar' }),
        ).toHaveAttribute('aria-checked', 'true');
        expect(
            screen.queryByRole('button', { name: 'Até' }),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId('recurrence-preview')).toHaveTextContent(
            'Todo mês no dia 15 · a partir de 15/10/2026 · sem data para acabar',
        );

        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        await waitFor(() =>
            expect(api.post).toHaveBeenCalledWith(
                '/clinic/finances/transactions',
                expect.objectContaining({
                    description: 'Aluguel',
                    gross_amount: 2500,
                    repeat: {
                        kind: 'recurrence',
                        frequency: 'monthly',
                        ends_on: null,
                    },
                }),
            ),
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('semanal até uma data pede a data e manda o ends_on escolhido', async () => {
        breakdown = ALUGUEL;
        api.post.mockResolvedValue({
            data: { data: savedTransaction({ type: 'saida' }) },
        });
        const user = userEvent.setup();
        renderModal({ type: 'saida' });

        await fillRent(user);
        await user.click(screen.getByRole('radio', { name: 'Recorrente' }));
        await user.click(screen.getByRole('radio', { name: 'Semanal' }));
        await user.click(screen.getByRole('radio', { name: 'Até uma data' }));
        expect(screen.getByTestId('recurrence-preview')).toHaveTextContent(
            'Toda quinta-feira · a partir de 15/10/2026',
        );

        await user.click(screen.getByRole('button', { name: 'Lançar' }));
        expect(
            await screen.findByText('Escolha até quando repete.'),
        ).toBeInTheDocument();
        expect(api.post).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Até' }));
        await user.click(
            await screen.findByRole('button', {
                name: /\b29 de outubro de 2026/,
            }),
        );
        expect(screen.getByTestId('recurrence-preview')).toHaveTextContent(
            'até 29/10/2026',
        );
        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        await waitFor(() =>
            expect(api.post).toHaveBeenCalledWith(
                '/clinic/finances/transactions',
                expect.objectContaining({
                    repeat: {
                        kind: 'recurrence',
                        frequency: 'weekly',
                        ends_on: '2026-10-29',
                    },
                }),
            ),
        );
    });

    it('anual mostra o dia e o mês na prévia', async () => {
        const user = userEvent.setup();
        renderModal({ type: 'saida' });

        await user.click(screen.getByRole('radio', { name: 'Recorrente' }));
        await user.click(screen.getByRole('radio', { name: 'Anual' }));

        expect(screen.getByTestId('recurrence-preview')).toHaveTextContent(
            'Todo ano em 15/10',
        );
    });

    it('o 422 de repeat.ends_on aparece no campo Até', async () => {
        breakdown = ALUGUEL;
        api.post.mockRejectedValue(
            validation({
                'repeat.ends_on': ['O fim não pode ser antes da data.'],
            }),
        );
        const user = userEvent.setup();
        const { onClose } = renderModal({ type: 'saida' });

        await fillRent(user);
        await user.click(screen.getByRole('radio', { name: 'Recorrente' }));
        await user.click(screen.getByRole('radio', { name: 'Até uma data' }));
        await user.click(screen.getByRole('button', { name: 'Até' }));
        await user.click(
            await screen.findByRole('button', {
                name: /\b29 de outubro de 2026/,
            }),
        );
        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        expect(
            await screen.findByText('O fim não pode ser antes da data.'),
        ).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('voltar para "Não repete" não manda o repeat', async () => {
        breakdown = ALUGUEL;
        api.post.mockResolvedValue({
            data: { data: savedTransaction({ type: 'saida' }) },
        });
        const user = userEvent.setup();
        renderModal({ type: 'saida' });

        await fillRent(user);
        await user.click(screen.getByRole('radio', { name: 'Recorrente' }));
        await user.click(screen.getByRole('radio', { name: 'Não repete' }));
        expect(
            screen.queryByRole('radiogroup', { name: 'Frequência' }),
        ).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Lançar' }));

        await waitFor(() => expect(api.post).toHaveBeenCalled());
        expect(api.post.mock.calls[0][1]).not.toHaveProperty('repeat');
    });
});
