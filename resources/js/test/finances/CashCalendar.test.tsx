import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
    FinanceCalendarMonth,
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

function month(
    period: string,
    days: FinanceCalendarMonth['days'],
): FinanceCalendarMonth {
    return { period, days };
}

function tx(id: number, day: string): FinancialTransaction {
    return {
        id: String(id),
        date: day,
        description: `Lançamento ${id}`,
        category: {
            id: '1',
            name: 'Sessões',
            type: 'entrada',
            origin: 'system',
            active: true,
            displayOrder: 0,
        },
        type: 'entrada',
        status: 'recebido',
        paymentMethod: 'pix',
        grossAmount: 10,
        feeAmount: 0,
        netAmount: 10,
    };
}

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

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15, 12, 0));
    getMonth.mockReset();
    list.mockReset();
    list.mockResolvedValue({
        data: [],
        meta: { page: 1, perPage: 25, total: 0 },
    });
});

afterEach(() => {
    vi.useRealTimers();
});

describe('Calendário de caixa', () => {
    it('mostra em cada dia o que entrou e saiu, vindo do servidor', async () => {
        getMonth.mockResolvedValue(
            month('2026-10', [
                { date: '2026-10-05', income: 287, expense: 45 },
                { date: '2026-10-20', income: 0, expense: 1250.5 },
            ]),
        );

        renderCalendar('2026-10');

        expect(
            await screen.findByRole('button', {
                name: /^Dia 5: entradas R\$\s287,00, saídas R\$\s45,00$/,
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', {
                name: /^Dia 20: entradas R\$\s0,00, saídas R\$\s1\.250,50$/,
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Dia 6' }),
        ).toBeInTheDocument();
        expect(getMonth).toHaveBeenCalledWith('2026-10');
    });

    it('no mês atual, o dia escolhido é hoje; nos outros, o primeiro dia com lançamento', async () => {
        getMonth.mockImplementation(async (period: string) =>
            period === '2026-10'
                ? month('2026-10', [
                      { date: '2026-10-03', income: 10, expense: 0 },
                  ])
                : month('2026-08', [
                      { date: '2026-08-21', income: 0, expense: 5 },
                      { date: '2026-08-09', income: 7, expense: 0 },
                  ]),
        );

        const { unmount } = renderCalendar('2026-10');
        expect(
            await screen.findByRole('button', { name: 'Dia 15' }),
        ).toHaveAttribute('aria-pressed', 'true');
        await waitFor(() =>
            expect(list).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: '2026-10-15',
                    to: '2026-10-15',
                }),
            ),
        );
        unmount();

        list.mockClear();
        renderCalendar('2026-08');
        expect(
            await screen.findByRole('button', { name: /^Dia 9:/ }),
        ).toHaveAttribute('aria-pressed', 'true');
        await waitFor(() =>
            expect(list).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: '2026-08-09',
                    to: '2026-08-09',
                }),
            ),
        );
    });

    it('tocar num dia busca só aquele dia e mostra a lista; "Ver mais" pede a próxima página', async () => {
        const user = userEvent.setup();
        getMonth.mockResolvedValue(
            month('2026-10', [{ date: '2026-10-07', income: 270, expense: 0 }]),
        );
        list.mockImplementation(
            async (params: { from: string; page: number }) => {
                if (params.from !== '2026-10-07') {
                    return {
                        data: [],
                        meta: { page: 1, perPage: 25, total: 0 },
                    };
                }
                const page =
                    params.page === 1
                        ? Array.from({ length: 25 }, (_, i) =>
                              tx(i + 1, '2026-10-07'),
                          )
                        : [tx(26, '2026-10-07'), tx(27, '2026-10-07')];
                return {
                    data: page,
                    meta: { page: params.page, perPage: 25, total: 27 },
                };
            },
        );
        renderCalendar('2026-10');

        await user.click(
            await screen.findByRole('button', { name: /^Dia 7:/ }),
        );

        expect(await screen.findByText('Lançamento 1')).toBeInTheDocument();
        expect(screen.getByText('27 lançamentos')).toBeInTheDocument();
        expect(screen.queryByText('Lançamento 26')).not.toBeInTheDocument();
        expect(list).toHaveBeenCalledWith(
            expect.objectContaining({
                from: '2026-10-07',
                to: '2026-10-07',
                page: 1,
            }),
        );
        const dayCalls = list.mock.calls
            .map(([params]) => params as { from?: string; period?: string })
            .filter((params) => params.from);
        expect(dayCalls.every((params) => !params.period)).toBe(true);
        expect(
            dayCalls.every(
                (params) =>
                    params.from === '2026-10-07' ||
                    params.from === '2026-10-15',
            ),
        ).toBe(true);

        await user.click(screen.getByRole('button', { name: 'Ver mais' }));

        expect(await screen.findByText('Lançamento 27')).toBeInTheDocument();
        expect(screen.getByText('Lançamento 1')).toBeInTheDocument();
        expect(list).toHaveBeenLastCalledWith(
            expect.objectContaining({ from: '2026-10-07', page: 2 }),
        );
        expect(
            screen.queryByRole('button', { name: 'Ver mais' }),
        ).not.toBeInTheDocument();
    });

    it('trocar de mês e voltar esquece o dia tocado e volta para hoje', async () => {
        const user = userEvent.setup();
        getMonth.mockImplementation(async (period: string) =>
            month(period, [{ date: `${period}-07`, income: 1, expense: 0 }]),
        );
        const view = renderCalendar('2026-10');
        await user.click(
            await screen.findByRole('button', { name: /^Dia 7:/ }),
        );
        expect(screen.getByRole('button', { name: /^Dia 7:/ })).toHaveAttribute(
            'aria-pressed',
            'true',
        );

        const client = new QueryClient();
        const rerenderAt = (period: string) =>
            view.rerender(
                <QueryClientProvider client={client}>
                    <CashCalendar
                        period={period}
                        hidden={false}
                        onOpen={vi.fn()}
                    />
                </QueryClientProvider>,
            );
        rerenderAt('2026-11');
        rerenderAt('2026-10');

        expect(
            await screen.findByRole('button', { name: 'Dia 15' }),
        ).toHaveAttribute('aria-pressed', 'true');
        expect(
            await screen.findByRole('button', { name: /^Dia 7:/ }),
        ).toHaveAttribute('aria-pressed', 'false');
    });
});
