import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
    FinanceListParams,
    FinancialTransaction,
    PaginatedResult,
} from '@/domain/clinic/finance';
import { PendingList } from '@/pages/clinic/finances/PendingList';

const list = vi.fn();
const setStatus = vi.fn();

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
                setStatus: (...args: unknown[]) => setStatus(...args),
            },
        };
    },
);

function tx(
    id: number,
    type: FinancialTransaction['type'],
    netAmount: number,
): FinancialTransaction {
    return {
        id: String(id),
        date: '2026-09-10',
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
        paymentMethod: 'boleto',
        grossAmount: netAmount,
        feeAmount: 0,
        netAmount,
    };
}

/** Um "servidor" em memória: a lista devolve só o que continua pendente. */
let db: FinancialTransaction[] = [];

function serve(
    params: FinanceListParams,
): PaginatedResult<FinancialTransaction> {
    const rows = db.filter(
        (t) => t.status === 'pendente' && t.type === params.type,
    );
    return {
        data: rows,
        meta: {
            page: 1,
            perPage: 25,
            total: rows.length,
            netTotal: rows.reduce((s, t) => s + t.netAmount, 0),
        },
    };
}

function renderList(type: FinancialTransaction['type'] = 'entrada') {
    const client = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={client}>
            <PendingList
                type={type}
                period="2026-10"
                todayKey="2026-10-15"
                hidden={false}
                onOpen={vi.fn()}
            />
            <Toaster theme="light" />
        </QueryClientProvider>,
    );
}

function rowOf(region: HTMLElement, description: string) {
    return within(region)
        .getByRole('button', { name: new RegExp(description) })
        .closest('li') as HTMLElement;
}

beforeEach(() => {
    db = [tx(1, 'entrada', 100), tx(2, 'entrada', 50), tx(3, 'saida', 80)];
    list.mockReset();
    list.mockImplementation(async (params: FinanceListParams) => serve(params));
    setStatus.mockReset();
    setStatus.mockImplementation(
        async (id: string, status: FinancialTransaction['status']) => {
            const row = db.find((t) => t.id === id)!;
            row.status = status;
            return { ...row };
        },
    );
});

afterEach(() => {
    vi.useRealTimers();
});

describe('Dar baixa com Desfazer', () => {
    it('"Recebido" tira a pendência da lista e "Desfazer" a traz de volta', async () => {
        const user = userEvent.setup();
        renderList('entrada');

        const receive = await screen.findByRole('region', {
            name: /A receber \(2\)/,
        });
        await within(receive).findByRole('button', { name: /Pendência 1/ });

        await user.click(
            within(rowOf(receive, 'Pendência 1')).getByRole('button', {
                name: 'Recebido',
            }),
        );

        expect(setStatus).toHaveBeenCalledWith('1', 'recebido');
        await waitFor(() =>
            expect(
                within(receive).queryByRole('button', {
                    name: /Pendência 1/,
                }),
            ).not.toBeInTheDocument(),
        );
        expect(
            screen.getByRole('region', { name: /A receber \(1\)/ }),
        ).toBeInTheDocument();
        expect(
            within(receive).getByRole('button', { name: /Pendência 2/ }),
        ).toBeInTheDocument();

        await user.click(
            await screen.findByRole('button', { name: 'Desfazer' }),
        );

        expect(setStatus).toHaveBeenLastCalledWith('1', 'pendente');
        expect(
            await within(receive).findByRole('button', {
                name: /Pendência 1/,
            }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('region', { name: /A receber \(2\)/ }),
        ).toBeInTheDocument();
    });

    it('duas baixas antes da primeira responder: as duas ganham aviso e Desfazer', async () => {
        const user = userEvent.setup();
        const answers: (() => void)[] = [];
        setStatus.mockImplementation(
            (id: string, status: FinancialTransaction['status']) =>
                new Promise((resolve) => {
                    answers.push(() => {
                        const row = db.find((t) => t.id === id)!;
                        row.status = status;
                        resolve({ ...row });
                    });
                }),
        );
        renderList('entrada');

        const receive = await screen.findByRole('region', {
            name: /A receber \(2\)/,
        });
        await within(receive).findByRole('button', { name: /Pendência 1/ });

        const first = within(rowOf(receive, 'Pendência 1')).getByRole(
            'button',
            { name: 'Recebido' },
        );
        const second = within(rowOf(receive, 'Pendência 2')).getByRole(
            'button',
            { name: 'Recebido' },
        );
        await user.click(first);
        await user.click(second);

        await waitFor(() => expect(answers).toHaveLength(2));
        expect(first).toBeDisabled();
        expect(second).toBeDisabled();

        answers[0]();
        answers[1]();

        expect(
            await screen.findByText('"Pendência 1" marcado como recebido.'),
        ).toBeInTheDocument();
        expect(
            await screen.findByText('"Pendência 2" marcado como recebido.'),
        ).toBeInTheDocument();
        expect(
            screen.getAllByRole('button', { name: 'Desfazer' }),
        ).toHaveLength(2);
    });

    it('na lista "a pagar" o botão é "Pago" e manda o status pago', async () => {
        const user = userEvent.setup();
        renderList('saida');

        const pay = await screen.findByRole('region', {
            name: /A pagar \(1\)/,
        });
        await user.click(
            within(await waitFor(() => rowOf(pay, 'Pendência 3'))).getByRole(
                'button',
                { name: 'Pago' },
            ),
        );

        expect(setStatus).toHaveBeenCalledWith('3', 'pago');
        await waitFor(() =>
            expect(
                within(pay).queryByRole('button', { name: /Pendência 3/ }),
            ).not.toBeInTheDocument(),
        );
        expect(await within(pay).findByText('Nada pendente.')).toBeVisible();
    });

    it('se a baixa falha, a pendência continua na lista e aparece o erro', async () => {
        const user = userEvent.setup();
        setStatus.mockRejectedValue(new Error('falhou'));
        renderList('entrada');

        const receive = await screen.findByRole('region', {
            name: /A receber \(2\)/,
        });
        await within(receive).findByRole('button', { name: /Pendência 1/ });
        await user.click(
            within(rowOf(receive, 'Pendência 1')).getByRole('button', {
                name: 'Recebido',
            }),
        );

        expect(
            await screen.findByText(/Não foi possível dar baixa/),
        ).toBeInTheDocument();
        expect(
            within(receive).getByRole('button', { name: /Pendência 1/ }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Desfazer' }),
        ).not.toBeInTheDocument();
    });
});
