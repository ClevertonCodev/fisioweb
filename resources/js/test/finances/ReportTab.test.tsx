import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { CategoryBreakdownRow } from '@/domain/clinic/finance';
import { ReportTab } from '@/pages/clinic/finances/ReportTab';

// A % que a API manda de propósito não bate com a conta na tela
// (97 / 147 = 66%): a tela tem de mostrar a da API, sem recalcular.
const breakdown: CategoryBreakdownRow[] = [
    {
        categoryId: 1,
        name: 'Consulta',
        type: 'entrada',
        count: 2,
        total: 97,
        percentage: 60,
    },
    {
        categoryId: 2,
        name: 'Pacote',
        type: 'entrada',
        count: 1,
        total: 50,
        percentage: 40,
    },
    {
        categoryId: 3,
        name: 'Aluguel',
        type: 'saida',
        count: 1,
        total: 30,
        percentage: 100,
    },
];

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
                getSummary: async () => ({
                    period: { year: 2026, month: 10 },
                    totals: { income: 147, expense: 30, balance: 117 },
                    variation: { income: null, expense: null, balance: null },
                }),
                getIncomeVsExpense: async () => [
                    { date: '2026-10-15', income: 147, expense: 30 },
                ],
                getMonthlyComparison: async () => [],
                getCategoryBreakdown: async () => breakdown,
            },
        };
    },
);

function renderTab() {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={client}>
            <ReportTab period="2026-10" hidden={false} />
        </QueryClientProvider>,
    );
}

function section(title: string) {
    return screen.getByRole('heading', { name: title }).closest('section')!;
}

describe('Aba Relatório', () => {
    it('mostra nas barras por categoria a % que vem da API', async () => {
        renderTab();

        await screen.findByText('Consulta');
        const entradas = within(section('De onde vem'));
        expect(entradas.getByText(/R\$ 97,00 · 60%/)).toBeInTheDocument();
        expect(entradas.getByText(/R\$ 50,00 · 40%/)).toBeInTheDocument();
        expect(
            within(section('Para onde vai')).getByText(/R\$ 30,00 · 100%/),
        ).toBeInTheDocument();
    });

    it('o eixo do dia a dia mostra reais quando o mês tem menos de mil', async () => {
        renderTab();

        const dia = within(
            (await screen.findByRole('heading', { name: 'Dia a dia' })).closest(
                'section',
            )!,
        );
        expect(await dia.findByText('147')).toBeInTheDocument();
        expect(dia.getByText('74')).toBeInTheDocument();
        expect(dia.queryByText('0 mil')).not.toBeInTheDocument();
    });

    it('mostra na tabela a % de cada categoria dentro do seu tipo, da API', async () => {
        const user = userEvent.setup();
        renderTab();
        await screen.findByText('Consulta');

        await user.click(
            screen.getByRole('button', { name: /Tabela por categoria/ }),
        );

        const table = screen.getByRole('table');
        expect(
            within(table).getByRole('columnheader', { name: '% do tipo' }),
        ).toBeInTheDocument();
        const consulta = within(table).getByRole('row', { name: /Consulta/ });
        expect(within(consulta).getByText('60%')).toBeInTheDocument();
        const aluguel = within(table).getByRole('row', { name: /Aluguel/ });
        expect(within(aluguel).getByText('100%')).toBeInTheDocument();
    });
});
