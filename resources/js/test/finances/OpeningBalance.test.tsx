import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MonthlySummary } from '@/domain/clinic/finance';
import FinancesPage from '@/pages/clinic/finances/FinancesPage';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

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

const getSummary = vi.fn();
const saveOpening = vi.fn();
const clearOpening = vi.fn();

vi.mock(
    '@/infrastructure/repositories/api-clinic-finance-transactions',
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import('@/infrastructure/repositories/api-clinic-finance-transactions')
            >();
        return {
            ...actual,
            apiClinicFinanceSummaryRepository: {
                ...actual.apiClinicFinanceSummaryRepository,
                getSummary: (...args: unknown[]) => getSummary(...args),
            },
            apiClinicFinanceTransactionsRepository: {
                ...actual.apiClinicFinanceTransactionsRepository,
                list: async () => ({
                    data: [],
                    meta: { total: 0, currentPage: 1, lastPage: 1 },
                }),
                listTrash: async () => ({
                    data: [],
                    meta: { total: 0, currentPage: 1, lastPage: 1 },
                }),
            },
        };
    },
);

vi.mock(
    '@/infrastructure/repositories/api-clinic-finance-opening-balance',
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import('@/infrastructure/repositories/api-clinic-finance-opening-balance')
            >();
        return {
            ...actual,
            apiClinicFinanceOpeningBalanceRepository: {
                save: (...args: unknown[]) => saveOpening(...args),
                clear: (...args: unknown[]) => clearOpening(...args),
            },
        };
    },
);

vi.mock(
    '@/infrastructure/repositories/api-clinic-finance-categories',
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import('@/infrastructure/repositories/api-clinic-finance-categories')
            >();
        return {
            ...actual,
            apiClinicFinanceCategoriesRepository: {
                ...actual.apiClinicFinanceCategoriesRepository,
                list: async () => [],
            },
        };
    },
);

function summary(overrides: Partial<MonthlySummary> = {}): MonthlySummary {
    return {
        period: { year: 2026, month: 10 },
        income: { received: 0, pending: 0 },
        expense: { paid: 0, pending: 0 },
        openingBalance: 1150,
        openingBalanceSource: 'computed',
        available: 1150,
        forecast: 1150,
        ...overrides,
    };
}

function renderPage() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter
                initialEntries={['/clinica/financas']}
                future={routerFutureFlags}
            >
                <Routes>
                    <Route
                        path="/clinica/financas"
                        element={<FinancesPage />}
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

async function strip() {
    const region = await screen.findByRole('region', {
        name: 'Resumo do mês',
    });
    await within(region).findByText(/^Saldo inicial\s+R\$\s*1\.150,00$/);
    return region;
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
    getSummary.mockReset();
    getSummary.mockResolvedValue(summary());
    saveOpening.mockReset();
    saveOpening.mockResolvedValue({ year: 2026, month: 10, amount: 900 });
    clearOpening.mockReset();
    clearOpening.mockResolvedValue(undefined);
    localStorage.clear();
});

describe('Saldo inicial no resumo do mês', () => {
    it('mostra "calculado do mês anterior" quando o saldo não foi digitado', async () => {
        renderPage();

        const region = await strip();
        expect(
            within(region).getByText(/calculado do mês anterior/i),
        ).toBeInTheDocument();
        expect(within(region).queryByText(/digitado/i)).toBeNull();
    });

    it('mostra "digitado" quando o mês tem valor digitado', async () => {
        getSummary.mockResolvedValue(
            summary({ openingBalance: 900, openingBalanceSource: 'typed' }),
        );
        renderPage();

        const region = await screen.findByRole('region', {
            name: 'Resumo do mês',
        });
        expect(
            await within(region).findByText(/digitado/i),
        ).toBeInTheDocument();
        expect(within(region).queryByText(/calculado/i)).toBeNull();
    });

    it('a secretária vê o saldo e a origem, sem o botão de editar', async () => {
        auth.role = 'secretary';
        renderPage();

        const region = await strip();
        expect(
            within(region).getByText(/calculado do mês anterior/i),
        ).toBeInTheDocument();
        expect(
            within(region).queryByRole('button', {
                name: /editar saldo inicial/i,
            }),
        ).toBeNull();
    });

    it('o administrador digita o saldo do mês e salva de verdade', async () => {
        const user = userEvent.setup();
        renderPage();

        const region = await strip();
        await user.click(
            within(region).getByRole('button', {
                name: /editar saldo inicial/i,
            }),
        );

        const dialog = await screen.findByRole('dialog');
        expect(
            within(dialog).queryByRole('button', {
                name: /voltar ao calculado/i,
            }),
        ).toBeNull();
        const input = within(dialog).getByLabelText(/saldo no dia 1/i);
        await user.clear(input);
        // O campo de dinheiro digita em centavos.
        await user.type(input, '90000');
        await user.click(
            within(dialog).getByRole('button', { name: 'Salvar' }),
        );

        expect(saveOpening).toHaveBeenCalledWith({
            year: expect.any(Number),
            month: expect.any(Number),
            amount: 900,
        });
    });

    it('no mês digitado, o modal volta ao calculado', async () => {
        const user = userEvent.setup();
        getSummary.mockResolvedValue(
            summary({ openingBalance: 900, openingBalanceSource: 'typed' }),
        );
        renderPage();

        const region = await screen.findByRole('region', {
            name: 'Resumo do mês',
        });
        await user.click(
            await within(region).findByRole('button', {
                name: /editar saldo inicial/i,
            }),
        );

        const dialog = await screen.findByRole('dialog');
        await user.click(
            within(dialog).getByRole('button', {
                name: /voltar ao calculado/i,
            }),
        );

        expect(clearOpening).toHaveBeenCalledWith(
            expect.stringMatching(/^\d{4}-\d{2}$/),
        );
    });
});
