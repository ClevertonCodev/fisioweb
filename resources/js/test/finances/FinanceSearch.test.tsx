import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
    FinanceListParams,
    FinancialTransaction,
} from '@/domain/clinic/finance';
import { CashCalendar } from '@/pages/clinic/finances/CashCalendar';

const getMonth = vi.fn();
const list = vi.fn();

vi.mock('@/infrastructure/repositories/api-clinic-finance-calendar', () => ({
    apiClinicFinanceCalendarRepository: {
        getMonth: (...args: unknown[]) => getMonth(...args),
    },
}));

vi.mock(
    '@/infrastructure/repositories/api-clinic-finance-transactions',
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import('@/infrastructure/repositories/api-clinic-finance-transactions')
            >();
        return {
            ...actual,
            apiClinicFinanceTransactionsRepository: {
                ...actual.apiClinicFinanceTransactionsRepository,
                list: (...args: unknown[]) => list(...args),
            },
        };
    },
);

function tx(
    id: number,
    date: string,
    description: string,
    type: FinancialTransaction['type'] = 'saida',
): FinancialTransaction {
    return {
        id: String(id),
        date,
        description,
        category: {
            id: '1',
            name: 'Aluguel',
            type,
            origin: 'system',
            active: true,
            displayOrder: 0,
        },
        type,
        status: type === 'entrada' ? 'recebido' : 'pago',
        paymentMethod: 'pix',
        grossAmount: 10,
        feeAmount: 0,
        netAmount: 10,
    };
}

const empty = { data: [], meta: { page: 1, perPage: 25, total: 0 } };

/** "Servidor": a busca devolve 27 aluguéis (2 páginas) e 1 entrada; o dia 15 tem um lançamento. */
function fakeServer(params: FinanceListParams) {
    if (params.q) {
        const all = [
            ...Array.from({ length: 26 }, (_, i) =>
                tx(
                    100 + i,
                    i === 0 ? '2026-10-05' : '2025-03-10',
                    `Aluguel ${i + 1}`,
                ),
            ),
            tx(200, '2024-01-20', 'Aluguel recebido', 'entrada'),
        ].filter((t) => !params.type || t.type === params.type);
        const page = params.page ?? 1;
        const perPage = params.perPage ?? 25;
        return {
            data: all.slice((page - 1) * perPage, page * perPage),
            meta: { page, perPage, total: all.length },
        };
    }
    if (params.from === '2026-10-15') {
        return {
            data: [tx(1, '2026-10-15', 'Conta de luz')],
            meta: { page: 1, perPage: 25, total: 1 },
        };
    }
    return empty;
}

function renderCalendar(onOpen = vi.fn()) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    render(
        <QueryClientProvider client={client}>
            <CashCalendar period="2026-10" hidden={false} onOpen={onOpen} />
        </QueryClientProvider>,
    );
    return onOpen;
}

function searchCalls() {
    return list.mock.calls
        .map(([params]) => params as FinanceListParams)
        .filter((params) => params.q);
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15, 12, 0));
    getMonth.mockReset();
    getMonth.mockResolvedValue({ period: '2026-10', days: [] });
    list.mockReset();
    list.mockImplementation(async (params: FinanceListParams) =>
        fakeServer(params),
    );
});

afterEach(() => {
    vi.useRealTimers();
});

describe('Busca no histórico', () => {
    it('digitar mostra os resultados de todo o histórico com a data no lugar da lista do dia', async () => {
        const user = userEvent.setup();
        renderCalendar();
        expect(await screen.findByText('Conta de luz')).toBeInTheDocument();

        await user.type(
            screen.getByRole('searchbox', { name: 'Buscar lançamentos' }),
            'aluguel',
        );

        const results = await screen.findByRole('region', {
            name: 'Resultado da busca',
        });
        expect(
            await within(results).findByText('Aluguel 1'),
        ).toBeInTheDocument();
        expect(within(results).getByText('27 resultados')).toBeInTheDocument();
        expect(within(results).getByText(/05\/10\/2026/)).toBeInTheDocument();
        expect(
            within(results).getAllByText(/10\/03\/2025/).length,
        ).toBeGreaterThan(0);
        expect(screen.queryByText('Conta de luz')).not.toBeInTheDocument();

        const calls = searchCalls();
        expect(calls.length).toBeGreaterThan(0);
        expect(calls.at(-1)).toEqual(
            expect.objectContaining({ q: 'aluguel', page: 1 }),
        );
        for (const params of calls) {
            expect(params.period).toBeUndefined();
            expect(params.from).toBeUndefined();
            expect(params.to).toBeUndefined();
        }
    });

    it('"Ver mais" pede a próxima página da busca', async () => {
        const user = userEvent.setup();
        renderCalendar();

        await user.type(
            await screen.findByRole('searchbox', {
                name: 'Buscar lançamentos',
            }),
            'aluguel',
        );
        expect(await screen.findByText('Aluguel 1')).toBeInTheDocument();
        expect(screen.queryByText('Aluguel recebido')).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Ver mais' }));

        expect(await screen.findByText('Aluguel recebido')).toBeInTheDocument();
        expect(screen.getByText('Aluguel 1')).toBeInTheDocument();
        expect(searchCalls().at(-1)).toEqual(
            expect.objectContaining({ q: 'aluguel', page: 2 }),
        );
        expect(
            screen.queryByRole('button', { name: 'Ver mais' }),
        ).not.toBeInTheDocument();
    });

    it('o chip de tipo filtra a busca', async () => {
        const user = userEvent.setup();
        renderCalendar();

        await user.type(
            await screen.findByRole('searchbox', {
                name: 'Buscar lançamentos',
            }),
            'aluguel',
        );
        await screen.findByText('Aluguel 1');

        await user.click(screen.getByRole('radio', { name: 'Entradas' }));

        expect(await screen.findByText('1 resultado')).toBeInTheDocument();
        expect(screen.getByText('Aluguel recebido')).toBeInTheDocument();
        expect(screen.queryByText('Aluguel 1')).not.toBeInTheDocument();
        expect(screen.getByRole('radio', { name: 'Entradas' })).toHaveAttribute(
            'aria-checked',
            'true',
        );
        expect(searchCalls().at(-1)).toEqual(
            expect.objectContaining({ q: 'aluguel', type: 'entrada' }),
        );

        await user.click(screen.getByRole('radio', { name: 'Tudo' }));
        expect(await screen.findByText('27 resultados')).toBeInTheDocument();
        expect(searchCalls().at(-1)?.type).toBeUndefined();
    });

    it('limpar a busca volta para a lista do dia', async () => {
        const user = userEvent.setup();
        renderCalendar();
        const input = await screen.findByRole('searchbox', {
            name: 'Buscar lançamentos',
        });

        await user.type(input, 'aluguel');
        await screen.findByText('Aluguel 1');

        await user.click(screen.getByRole('button', { name: 'Limpar busca' }));

        expect(await screen.findByText('Conta de luz')).toBeInTheDocument();
        expect(input).toHaveValue('');
        expect(
            screen.queryByRole('region', { name: 'Resultado da busca' }),
        ).not.toBeInTheDocument();
    });

    it('sem resultado, diz que não achou', async () => {
        const user = userEvent.setup();
        list.mockImplementation(async (params: FinanceListParams) =>
            params.q ? empty : fakeServer(params),
        );
        renderCalendar();

        await user.type(
            await screen.findByRole('searchbox', {
                name: 'Buscar lançamentos',
            }),
            'xyz',
        );

        expect(
            await screen.findByText('Nenhum lançamento encontrado para “xyz”.'),
        ).toBeInTheDocument();
    });

    it('tocar num resultado abre a edição dele', async () => {
        const user = userEvent.setup();
        const onOpen = renderCalendar();

        await user.type(
            await screen.findByRole('searchbox', {
                name: 'Buscar lançamentos',
            }),
            'aluguel',
        );
        const row = (await screen.findByText('Aluguel 1')).closest('button');
        expect(row).not.toBeNull();
        await user.click(row!);

        await waitFor(() =>
            expect(onOpen).toHaveBeenCalledWith(
                expect.objectContaining({ id: '100' }),
            ),
        );
    });
});
