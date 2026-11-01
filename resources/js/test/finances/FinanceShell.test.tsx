import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentType, ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { MonthlySummary } from '@/domain/clinic/finance';
import FinancesCategoriesPage from '@/pages/clinic/finances/FinancesCategoriesPage';
import FinancesPage from '@/pages/clinic/finances/FinancesPage';
import FinancesTrashPage from '@/pages/clinic/finances/FinancesTrashPage';
import { routerFutureFlags } from '@/test/browser-router';

vi.mock('@/components/clinic/ClinicLayout', () => ({
    ClinicLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 1, name: 'Ana', type: 'clinic', role: 'admin' },
        token: 'fake',
        login: vi.fn(),
        logout: vi.fn(),
        guard: 'clinic',
    }),
}));

const getSummary = vi.fn();

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

vi.mock(
    '@/infrastructure/repositories/api-clinic-finance-report',
    async (importOriginal) => {
        const actual =
            await importOriginal<
                typeof import('@/infrastructure/repositories/api-clinic-finance-report')
            >();
        return {
            ...actual,
            apiClinicFinanceReportRepository: {
                ...actual.apiClinicFinanceReportRepository,
                getSummary: () => new Promise(() => {}),
                getIncomeVsExpense: () => new Promise(() => {}),
                getMonthlyComparison: () => new Promise(() => {}),
                getCategoryBreakdown: () => new Promise(() => {}),
            },
        };
    },
);

function summary(overrides: Partial<MonthlySummary> = {}): MonthlySummary {
    return {
        period: { year: 2026, month: 10 },
        income: { received: 97, pending: 190 },
        expense: { paid: 45, pending: 78 },
        openingBalance: 0,
        openingBalanceSource: 'computed',
        available: 52,
        forecast: 164,
        ...overrides,
    };
}

function renderAt(url: string, Page: ComponentType = FinancesPage) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <MemoryRouter initialEntries={[url]} future={routerFutureFlags}>
                <Routes>
                    <Route path={url.split('?')[0]} element={<Page />} />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
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
    getSummary.mockReset();
    getSummary.mockResolvedValue(summary());
    localStorage.clear();
});

describe('Finanças (casca v2)', () => {
    it('abre a casca v2 sem ?variant=, na aba Lançamentos, com o resumo do mês', async () => {
        renderAt('/clinica/financas');

        expect(
            screen.getByRole('heading', { name: 'Finanças' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('tab', { name: 'Lançamentos' }),
        ).toHaveAttribute('aria-selected', 'true');
        const resumo = await screen.findByRole('region', {
            name: 'Resumo do mês',
        });
        expect(await within(resumo).findByText('R$ 52,00')).toBeInTheDocument();
        expect(within(resumo).getByText('R$ 97,00')).toBeInTheDocument();
    });

    it.each([
        ['relatorio', 'Relatório'],
        ['configuracoes', 'Configurações'],
        ['lancamentos', 'Lançamentos'],
    ])('?aba=%s abre a aba %s', (aba, label) => {
        renderAt(`/clinica/financas?aba=${aba}`);

        expect(screen.getByRole('tab', { name: label })).toHaveAttribute(
            'aria-selected',
            'true',
        );
    });

    it('o olho esconde e mostra os valores do resumo, e lembra a escolha', async () => {
        const user = userEvent.setup();
        const { unmount } = renderAt('/clinica/financas');
        const resumo = await screen.findByRole('region', {
            name: 'Resumo do mês',
        });
        await within(resumo).findByText('R$ 52,00');

        await user.click(
            screen.getByRole('button', { name: 'Esconder valores' }),
        );
        expect(within(resumo).queryByText('R$ 52,00')).not.toBeInTheDocument();
        expect(within(resumo).queryByText('R$ 97,00')).not.toBeInTheDocument();
        expect(within(resumo).getAllByText(/R\$ •••/).length).toBeGreaterThan(
            0,
        );

        unmount();
        renderAt('/clinica/financas');
        const again = await screen.findByRole('region', {
            name: 'Resumo do mês',
        });
        expect(
            screen.getByRole('button', { name: 'Mostrar valores' }),
        ).toBeInTheDocument();
        expect(within(again).queryByText('R$ 52,00')).not.toBeInTheDocument();

        await user.click(
            screen.getByRole('button', { name: 'Mostrar valores' }),
        );
        expect(await within(again).findByText('R$ 52,00')).toBeInTheDocument();
    });

    it('o seletor de mês troca o period do resumo e volta para hoje', async () => {
        const user = userEvent.setup();
        const today = new Date();
        const period = (d: Date) =>
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const next = period(
            new Date(today.getFullYear(), today.getMonth() + 1, 1),
        );
        renderAt('/clinica/financas');
        await screen.findByRole('region', { name: 'Resumo do mês' });
        expect(getSummary).toHaveBeenLastCalledWith({ period: period(today) });
        expect(
            screen.queryByRole('button', { name: 'Voltar para hoje' }),
        ).not.toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Próximo mês' }));
        expect(getSummary).toHaveBeenLastCalledWith({ period: next });

        await user.click(
            screen.getByRole('button', { name: 'Voltar para hoje' }),
        );
        expect(getSummary).toHaveBeenLastCalledWith({ period: period(today) });
    });

    it.each([
        ['/clinica/financas/categorias', FinancesCategoriesPage],
        ['/clinica/financas/lixeira', FinancesTrashPage],
    ])('%s abre a aba Configurações', (url, Page) => {
        renderAt(url, Page);

        expect(
            screen.getByRole('tab', { name: 'Configurações' }),
        ).toHaveAttribute('aria-selected', 'true');
    });

    it('?aba= desconhecida cai em Lançamentos', () => {
        renderAt('/clinica/financas?aba=qualquer');

        expect(
            screen.getByRole('tab', { name: 'Lançamentos' }),
        ).toHaveAttribute('aria-selected', 'true');
    });
});
