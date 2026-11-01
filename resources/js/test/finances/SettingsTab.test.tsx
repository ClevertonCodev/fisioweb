import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
    FinancialTransaction,
    MonthlySummary,
    OpeningBalanceSource,
} from '@/domain/clinic/finance';
import FinancesTrashPage from '@/pages/clinic/finances/FinancesTrashPage';
import { SettingsTab } from '@/pages/clinic/finances/SettingsTab';
import { routerFutureFlags } from '@/test/browser-router';

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

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

const toast = vi.hoisted(() => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
}));
vi.mock('sonner', () => ({ toast }));

const tx = vi.hoisted(() => ({
    listTrash: vi.fn(),
    restore: vi.fn(),
    list: vi.fn(),
    getSummary: vi.fn(),
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
                listTrash: tx.listTrash,
                restore: tx.restore,
                list: tx.list,
            },
            apiClinicFinanceSummaryRepository: {
                ...actual.apiClinicFinanceSummaryRepository,
                getSummary: tx.getSummary,
            },
        };
    },
);

const categories = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock('@/infrastructure/repositories/api-clinic-finance-categories', () => ({
    apiClinicFinanceCategoriesRepository: categories,
}));

function deleted(
    overrides: Partial<FinancialTransaction>,
): FinancialTransaction {
    return {
        id: '10',
        date: '2026-10-15',
        description: 'Sessão — Maria',
        category: {
            id: '1',
            name: 'Sessão avulsa',
            type: 'entrada',
            origin: 'system',
            active: true,
            displayOrder: 1,
        },
        type: 'entrada',
        status: 'recebido',
        paymentMethod: 'pix',
        grossAmount: 100,
        feeAmount: 0,
        netAmount: 100,
        deletedAt: '2026-10-20T10:00:00Z',
        deletedBy: { id: '1', name: 'Ana' },
        ...overrides,
    };
}

function page(items: FinancialTransaction[], total = items.length, n = 1) {
    return { data: items, meta: { page: n, perPage: 25, total } };
}

function summary(): MonthlySummary {
    return {
        period: { year: 2026, month: 10 },
        income: { received: 0, pending: 0 },
        expense: { paid: 0, pending: 0 },
        openingBalance: 1500,
        openingBalanceSource: 'computed',
        available: 1500,
        forecast: 1500,
    };
}

function client() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
}

function renderTab(
    props: {
        source?: OpeningBalanceSource;
        onEditOpening?: () => void;
    } = {},
    qc = client(),
) {
    return render(
        <QueryClientProvider client={qc}>
            <SettingsTab
                period="2026-10"
                hidden={false}
                openingBalance={1500}
                openingBalanceSource={props.source ?? 'computed'}
                onEditOpening={props.onEditOpening ?? vi.fn()}
            />
        </QueryClientProvider>,
    );
}

function trashSection() {
    return screen.getByRole('region', { name: /Lixeira/ });
}

beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
});

beforeEach(() => {
    auth.role = 'admin';
    vi.clearAllMocks();
    tx.listTrash.mockResolvedValue(page([deleted({})]));
    tx.list.mockResolvedValue(page([]));
    tx.getSummary.mockResolvedValue(summary());
    categories.list.mockResolvedValue([]);
});

describe('Configurações de Finanças: saldo, lixeira e seções por papel', () => {
    it('o administrador vê categorias, saldo e lixeira, e não vê repasses', async () => {
        renderTab();

        expect(
            await screen.findByRole('heading', { name: 'Categorias' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('region', { name: 'Saldo inicial' }),
        ).toBeInTheDocument();
        expect(trashSection()).toBeInTheDocument();
        expect(screen.queryByText(/Repasses/)).not.toBeInTheDocument();
        expect(screen.queryByText(/plano avançado/)).not.toBeInTheDocument();
    });

    it('a secretária vê só a lixeira', async () => {
        auth.role = 'secretary';
        renderTab();

        expect(
            await within(trashSection()).findByText('Sessão — Maria'),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('heading', { name: 'Categorias' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('region', { name: 'Saldo inicial' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /Alterar saldo/ }),
        ).not.toBeInTheDocument();
        expect(screen.queryByText(/Repasses/)).not.toBeInTheDocument();
        expect(categories.list).not.toHaveBeenCalled();
    });

    it.each([
        ['computed', 'Calculado do mês anterior'],
        ['typed', 'Digitado'],
    ] as const)(
        'o saldo %s diz a origem e o botão abre o modal',
        async (source, label) => {
            const user = userEvent.setup();
            const onEditOpening = vi.fn();
            renderTab({ source, onEditOpening });

            const saldo = screen.getByRole('region', { name: 'Saldo inicial' });
            expect(within(saldo).getByText('R$ 1.500,00')).toBeInTheDocument();
            expect(within(saldo).getByText(label)).toBeInTheDocument();

            await user.click(
                within(saldo).getByRole('button', {
                    name: 'Alterar saldo inicial',
                }),
            );
            expect(onEditOpening).toHaveBeenCalledOnce();
        },
    );

    it('restaurar chama a API, invalida ["finance"] e o item sai da lixeira', async () => {
        const user = userEvent.setup();
        const qc = client();
        const invalidate = vi.spyOn(qc, 'invalidateQueries');
        tx.restore.mockResolvedValue(deleted({ deletedAt: undefined }));
        renderTab({}, qc);

        const item = await within(trashSection()).findByText('Sessão — Maria');
        expect(
            within(trashSection()).getByRole('heading', {
                name: 'Lixeira (1)',
            }),
        ).toBeInTheDocument();
        tx.listTrash.mockResolvedValue(page([]));

        await user.click(
            within(item.closest('li')!).getByRole('button', {
                name: 'Restaurar Sessão — Maria',
            }),
        );

        await waitFor(() => expect(tx.restore).toHaveBeenCalledWith('10'));
        expect(invalidate).toHaveBeenCalledWith({ queryKey: ['finance'] });
        expect(toast.success).toHaveBeenCalledWith(
            'Lançamento restaurado. Ele voltou para 15/10/2026.',
        );
        expect(
            await within(trashSection()).findByText('A lixeira está vazia.'),
        ).toBeInTheDocument();
        expect(
            within(trashSection()).queryByText('Sessão — Maria'),
        ).not.toBeInTheDocument();
    });

    it('restaurar que falha mostra a mensagem da API', async () => {
        const user = userEvent.setup();
        tx.restore.mockRejectedValue({
            response: { data: { message: 'Lançamento não encontrado.' } },
        });
        renderTab();

        const item = await within(trashSection()).findByText('Sessão — Maria');
        await user.click(
            within(item.closest('li')!).getByRole('button', {
                name: 'Restaurar Sessão — Maria',
            }),
        );

        await waitFor(() =>
            expect(toast.error).toHaveBeenCalledWith(
                'Lançamento não encontrado.',
            ),
        );
    });

    it('a lixeira é paginada pelo servidor', async () => {
        const user = userEvent.setup();
        const items = Array.from({ length: 25 }, (_, i) =>
            deleted({ id: String(i + 1), description: `Item ${i + 1}` }),
        );
        tx.listTrash.mockImplementation(async (params: { page?: number }) =>
            params.page === 2
                ? page([deleted({ id: '99', description: 'Item 26' })], 26, 2)
                : page(items, 26),
        );
        renderTab();

        expect(
            await within(trashSection()).findByText('Item 1'),
        ).toBeInTheDocument();
        expect(
            within(trashSection()).getByRole('heading', {
                name: 'Lixeira (26)',
            }),
        ).toBeInTheDocument();
        expect(tx.listTrash).toHaveBeenLastCalledWith({
            page: 1,
            perPage: 25,
        });

        // O DsPagination tem um par de botões para desktop e outro para celular.
        await user.click(
            within(trashSection()).getAllByRole('button', {
                name: 'Próxima página',
            })[0]!,
        );

        expect(
            await within(trashSection()).findByText('Item 26'),
        ).toBeInTheDocument();
        expect(tx.listTrash).toHaveBeenLastCalledWith({
            page: 2,
            perPage: 25,
        });

        // Restaurar o único item da página 2 volta para a página 1.
        tx.restore.mockResolvedValue(deleted({ id: '99' }));
        tx.listTrash.mockImplementation(async () => page(items, 25));
        await user.click(
            within(trashSection()).getByRole('button', {
                name: 'Restaurar Item 26',
            }),
        );

        expect(
            await within(trashSection()).findByText('Item 1'),
        ).toBeInTheDocument();
        expect(tx.listTrash).toHaveBeenLastCalledWith({
            page: 1,
            perPage: 25,
        });
    });

    it('/clinica/financas/lixeira abre Configurações rolando até a lixeira', async () => {
        auth.role = 'secretary';
        const scroll = vi.mocked(Element.prototype.scrollIntoView);
        render(
            <QueryClientProvider client={client()}>
                <MemoryRouter
                    initialEntries={['/clinica/financas/lixeira']}
                    future={routerFutureFlags}
                >
                    <Routes>
                        <Route
                            path="/clinica/financas/lixeira"
                            element={<FinancesTrashPage />}
                        />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>,
        );

        expect(
            screen.getByRole('tab', { name: 'Configurações' }),
        ).toHaveAttribute('aria-selected', 'true');
        await within(trashSection()).findByText('Sessão — Maria');
        await waitFor(() =>
            expect(scroll.mock.contexts).toContain(trashSection()),
        );
    });
});
