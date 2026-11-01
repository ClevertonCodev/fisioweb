import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FinancialTransaction } from '@/domain/clinic/finance';
import { TransactionModal } from '@/pages/clinic/finances/TransactionModal';

const api = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
}));
vi.mock('@/infrastructure/api/client', () => ({ apiClient: api }));

const toast = vi.hoisted(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
}));
vi.mock('sonner', () => ({ toast }));

const RENT = {
    id: 10,
    name: 'Aluguel',
    type: 'saida',
    origin: 'system',
    active: true,
    display_order: 1,
};

/** O lançamento salvo, como a API devolve. */
const SAVED = {
    id: 43,
    date: '2027-03-10',
    description: 'Aluguel',
    category: RENT,
    type: 'saida',
    status: 'pendente',
    payment_method: 'boleto',
    gross_amount: '3000.00',
    fee_amount: '0.00',
    net_amount: '3000.00',
    series: { id: 8, kind: 'recurrence', index: 1, total: null },
};

/** A ocorrência de março de um aluguel mensal (a 3ª da série). */
function marchRent(): FinancialTransaction {
    return {
        id: '43',
        date: '2027-03-10',
        description: 'Aluguel',
        category: {
            id: '10',
            name: 'Aluguel',
            type: 'saida',
            origin: 'system',
            active: true,
            displayOrder: 1,
        },
        type: 'saida',
        status: 'pendente',
        paymentMethod: 'boleto',
        grossAmount: 2500,
        feeAmount: 0,
        netAmount: 2500,
        notes: null,
        series: { id: '7', kind: 'recurrence', index: 3, total: null },
    };
}

function renderModal(onClose = vi.fn()) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <TransactionModal
                draft={{ type: 'saida', editing: marchRent() }}
                period="2027-03"
                onClose={onClose}
            />
        </QueryClientProvider>,
    );
    return { onClose };
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2027, 2, 5, 12, 0));
    api.get.mockReset();
    api.put.mockReset();
    api.delete.mockReset();
    toast.success.mockReset();
    api.get.mockImplementation(async (url: string) => {
        if (url === '/clinic/finances/categories')
            return { data: { data: [RENT] } };
        if (url === '/clinic/finances/reports/category-breakdown')
            return { data: { data: [] } };
        throw new Error(`GET inesperado: ${url}`);
    });
});

describe('Modal de lançamento: ocorrência de recorrência', () => {
    it('salvar pergunta "Só este / Este e os próximos" e "Este e os próximos" manda scope following', async () => {
        api.put.mockResolvedValue({
            data: { data: SAVED },
        });
        const user = userEvent.setup();
        const { onClose } = renderModal();

        await user.click(screen.getByRole('button', { name: 'Salvar' }));

        const ask = await screen.findByRole('dialog', {
            name: 'Alterar a ocorrência 3',
        });
        expect(api.put).not.toHaveBeenCalled();
        expect(
            within(ask).getByRole('button', { name: 'Só este' }),
        ).toBeInTheDocument();
        // Na recorrência, "este e os próximos" muda a regra dali para frente.
        expect(ask).toHaveTextContent(/a regra muda daqui para frente/);
        expect(ask).toHaveTextContent(
            /os anteriores e os já pagos ou recebidos ficam/,
        );
        await user.click(
            within(ask).getByRole('button', { name: 'Este e os próximos' }),
        );

        await waitFor(() =>
            expect(api.put).toHaveBeenCalledWith(
                '/clinic/finances/transactions/43',
                expect.objectContaining({ scope: 'following' }),
            ),
        );
        expect(api.put.mock.calls[0][1]).not.toHaveProperty('repeat');
        await waitFor(() => expect(onClose).toHaveBeenCalled());
    });

    it('"Só este" manda scope only', async () => {
        api.put.mockResolvedValue({
            data: { data: SAVED },
        });
        const user = userEvent.setup();
        renderModal();

        await user.click(screen.getByRole('button', { name: 'Salvar' }));
        const ask = await screen.findByRole('dialog', {
            name: 'Alterar a ocorrência 3',
        });
        await user.click(within(ask).getByRole('button', { name: 'Só este' }));

        await waitFor(() =>
            expect(api.put).toHaveBeenCalledWith(
                '/clinic/finances/transactions/43',
                expect.objectContaining({ scope: 'only' }),
            ),
        );
    });

    it('excluir pergunta "Só este / Este e os próximos", encerra a repetição e avisa', async () => {
        api.delete.mockResolvedValue({ data: null });
        const user = userEvent.setup();
        const { onClose } = renderModal();

        await user.click(screen.getByRole('button', { name: 'Excluir' }));
        const confirm = await screen.findByRole('dialog', {
            name: 'Excluir a ocorrência 3?',
        });
        expect(confirm).toHaveTextContent(/encerra a repetição/);
        await user.click(
            within(confirm).getByRole('button', { name: 'Este e os próximos' }),
        );

        await waitFor(() =>
            expect(api.delete).toHaveBeenCalledWith(
                '/clinic/finances/transactions/43',
                { params: { scope: 'following' } },
            ),
        );
        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(toast.success).toHaveBeenCalledWith(
            'Repetição encerrada. Esta e as próximas pendentes foram para a lixeira.',
        );
    });

    it('excluir "Só este" manda scope only e não fala em encerrar', async () => {
        api.delete.mockResolvedValue({ data: null });
        const user = userEvent.setup();
        renderModal();

        await user.click(screen.getByRole('button', { name: 'Excluir' }));
        const confirm = await screen.findByRole('dialog', {
            name: 'Excluir a ocorrência 3?',
        });
        await user.click(
            within(confirm).getByRole('button', { name: 'Só este' }),
        );

        await waitFor(() =>
            expect(api.delete).toHaveBeenCalledWith(
                '/clinic/finances/transactions/43',
                { params: { scope: 'only' } },
            ),
        );
        await waitFor(() =>
            expect(toast.success).toHaveBeenCalledWith(
                'Lançamento enviado para a lixeira.',
            ),
        );
    });
});
