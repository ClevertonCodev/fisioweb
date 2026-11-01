import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
    FinanceListParams,
    FinancialTransaction,
    PaginatedResult,
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
    type: FinancialTransaction['type'],
    netAmount = 10,
): FinancialTransaction {
    return {
        id: String(id),
        date,
        description: `Pendência ${id}`,
        category: {
            id: '1',
            name: 'Sessões',
            type,
            origin: 'system',
            active: true,
            displayOrder: 0,
        },
        type,
        status: 'pendente',
        paymentMethod: 'pix',
        grossAmount: netAmount,
        feeAmount: 0,
        netAmount,
    };
}

function page(
    data: FinancialTransaction[],
    total = data.length,
    netTotal = data.reduce((s, t) => s + t.netAmount, 0),
    pageNumber = 1,
): PaginatedResult<FinancialTransaction> {
    return { data, meta: { page: pageNumber, perPage: 25, total, netTotal } };
}

const empty = page([]);

function renderCalendar(period = '2026-10') {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <CashCalendar period={period} hidden={false} onOpen={vi.fn()} />
        </QueryClientProvider>,
    );
}

function pendingSection(title: RegExp) {
    return screen.getByRole('region', { name: title });
}

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15, 12, 0));
    getMonth.mockReset();
    getMonth.mockResolvedValue({ period: '2026-10', days: [] });
    list.mockReset();
    list.mockResolvedValue(empty);
});

afterEach(() => {
    vi.useRealTimers();
});

describe('A receber e a pagar', () => {
    it('pede ao servidor as pendências até o fim do mês na tela, uma lista por tipo', async () => {
        renderCalendar('2026-10');

        await waitFor(() => {
            const calls = list.mock.calls.map(
                ([params]) => params as FinanceListParams,
            );
            expect(calls).toContainEqual(
                expect.objectContaining({
                    overdueUntil: '2026-10-31',
                    status: 'pendente',
                    type: 'entrada',
                    page: 1,
                }),
            );
            expect(calls).toContainEqual(
                expect.objectContaining({
                    overdueUntil: '2026-10-31',
                    status: 'pendente',
                    type: 'saida',
                    page: 1,
                }),
            );
        });
        const pendingCalls = list.mock.calls
            .map(([params]) => params as FinanceListParams)
            .filter((params) => params.overdueUntil);
        expect(pendingCalls.every((params) => !params.period)).toBe(true);
    });

    it('uma pendência de setembro aparece em outubro com "Atrasado" e o mês na data', async () => {
        list.mockImplementation(async (params: FinanceListParams) => {
            if (params.overdueUntil && params.type === 'entrada') {
                return page([
                    tx(1, '2026-09-10', 'entrada', 100),
                    tx(2, '2026-10-20', 'entrada', 50),
                ]);
            }
            return empty;
        });

        renderCalendar('2026-10');

        const receive = await screen.findByRole('region', {
            name: /A receber/,
        });
        const late = await within(receive).findByRole('button', {
            name: /Pendência 1/,
        });
        expect(late).toHaveTextContent('10 de set.');
        expect(late).toHaveTextContent('Atrasado');

        const onTime = within(receive).getByRole('button', {
            name: /Pendência 2/,
        });
        expect(onTime).toHaveTextContent('dia 20');
        expect(onTime).not.toHaveTextContent('Atrasado');
        expect(onTime).not.toHaveTextContent('out.');
    });

    it('o total e a contagem vêm do servidor, mesmo com mais de uma página', async () => {
        const user = userEvent.setup();
        list.mockImplementation(async (params: FinanceListParams) => {
            if (params.overdueUntil && params.type === 'saida') {
                return params.page === 1
                    ? page(
                          Array.from({ length: 25 }, (_, i) =>
                              tx(i + 1, '2026-10-05', 'saida', 10),
                          ),
                          27,
                          1234.56,
                      )
                    : page(
                          [
                              tx(26, '2026-10-06', 'saida', 7),
                              tx(27, '2026-10-07', 'saida', 7),
                          ],
                          27,
                          1234.56,
                          2,
                      );
            }
            return empty;
        });

        renderCalendar('2026-10');

        const pay = await screen.findByRole('region', {
            name: /A pagar \(27\)/,
        });
        expect(pay).toHaveTextContent(/R\$\s1\.234,56/);
        expect(
            within(pay).queryByRole('button', { name: /Pendência 26/ }),
        ).not.toBeInTheDocument();

        await user.click(within(pay).getByRole('button', { name: 'Ver mais' }));

        expect(
            await within(pay).findByRole('button', { name: /Pendência 27/ }),
        ).toBeInTheDocument();
        expect(list).toHaveBeenLastCalledWith(
            expect.objectContaining({ overdueUntil: '2026-10-31', page: 2 }),
        );
        expect(pay).toHaveTextContent(/R\$\s1\.234,56/);
        expect(
            within(pay).queryByRole('button', { name: 'Ver mais' }),
        ).not.toBeInTheDocument();
    });

    it('sem pendências mostra "Nada pendente."; com erro, "Tentar de novo"', async () => {
        list.mockImplementation(async (params: FinanceListParams) => {
            if (params.overdueUntil && params.type === 'saida') {
                throw new Error('falhou');
            }
            return empty;
        });

        renderCalendar('2026-10');

        const receive = await screen.findByRole('region', {
            name: /A receber/,
        });
        expect(
            await within(receive).findByText('Nada pendente.'),
        ).toBeInTheDocument();
        const pay = pendingSection(/A pagar/);
        expect(
            await within(pay).findByRole('button', { name: 'Tentar de novo' }),
        ).toBeInTheDocument();
    });
});
