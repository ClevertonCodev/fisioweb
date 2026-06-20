import type {
    CategoryBreakdownRow,
    CategoryDistributionPoint,
    FinanceListParams,
    IncomeVsExpensePoint,
    MonthlyComparisonPoint,
    ReportSummary,
} from '@/domain/clinic/finance';
import { apiClient } from '@/infrastructure/api/client';

function buildReportParams(params: FinanceListParams = {}) {
    return {
        period: params.period,
        type: params.type,
    };
}

export const apiClinicFinanceReportRepository = {
    async getSummary(params: FinanceListParams = {}): Promise<ReportSummary> {
        const { data } = await apiClient.get<{ data: ReportSummary }>(
            '/clinic/finances/reports/summary',
            { params: { period: params.period } },
        );
        return data.data;
    },

    async getIncomeVsExpense(
        params: FinanceListParams = {},
    ): Promise<IncomeVsExpensePoint[]> {
        const { data } = await apiClient.get<{ data: IncomeVsExpensePoint[] }>(
            '/clinic/finances/reports/income-vs-expense',
            { params: { period: params.period } },
        );
        return data.data;
    },

    async getCategoryDistribution(
        params: FinanceListParams = {},
    ): Promise<CategoryDistributionPoint[]> {
        const { data } = await apiClient.get<{
            data: CategoryDistributionPoint[];
        }>('/clinic/finances/reports/category-distribution', {
            params: { period: params.period, limit: 5 },
        });
        return data.data;
    },

    async getMonthlyComparison(): Promise<MonthlyComparisonPoint[]> {
        const { data } = await apiClient.get<{
            data: MonthlyComparisonPoint[];
        }>('/clinic/finances/reports/monthly-comparison', { params: { months: 12 } });
        return data.data;
    },

    async getCategoryBreakdown(
        params: FinanceListParams = {},
    ): Promise<CategoryBreakdownRow[]> {
        const { data } = await apiClient.get<{
            data: Array<{
                category_id: number;
                name: string;
                type: CategoryBreakdownRow['type'];
                count: number;
                total: number;
                percentage: number;
            }>;
        }>('/clinic/finances/reports/category-breakdown', {
            params: buildReportParams(params),
        });

        return data.data.map((row) => ({
            categoryId: row.category_id,
            name: row.name,
            type: row.type,
            count: row.count,
            total: row.total,
            percentage: row.percentage,
        }));
    },
};
