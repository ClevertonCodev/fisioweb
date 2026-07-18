import {
    useFinanceCategoryBreakdown,
    useFinanceCategoryDistribution,
    useFinanceIncomeVsExpense,
    useFinanceMonthlyComparison,
    useFinanceReportSummary,
} from '@/application/clinic/use-finance-report';
import { CategoryBreakdownTable } from '@/components/clinic/finances/report/CategoryBreakdownTable';
import { CategoryDistributionPieChart } from '@/components/clinic/finances/report/CategoryDistributionPieChart';
import { IncomeVsExpenseLineChart } from '@/components/clinic/finances/report/IncomeVsExpenseLineChart';
import { MonthlyComparisonBarChart } from '@/components/clinic/finances/report/MonthlyComparisonBarChart';
import { ReportCards } from '@/components/clinic/finances/report/ReportCards';
import type { FinanceListParams } from '@/domain/clinic/finance';

interface FinanceReportPanelProps {
    params: FinanceListParams;
    hidden: boolean;
}

export function FinanceReportPanel({
    params,
    hidden,
}: FinanceReportPanelProps) {
    const summary = useFinanceReportSummary(params);
    const incomeVsExpense = useFinanceIncomeVsExpense(params);
    const distribution = useFinanceCategoryDistribution(params);
    const monthly = useFinanceMonthlyComparison();
    const breakdown = useFinanceCategoryBreakdown(params);

    return (
        <div className="space-y-6">
            <ReportCards
                data={summary.data}
                hidden={hidden}
                isLoading={summary.isLoading}
                isError={summary.isError}
            />
            <div className="grid gap-6 lg:grid-cols-2">
                <IncomeVsExpenseLineChart
                    data={incomeVsExpense.data}
                    hidden={hidden}
                    isLoading={incomeVsExpense.isLoading}
                    isError={incomeVsExpense.isError}
                />
                <CategoryDistributionPieChart
                    data={distribution.data}
                    hidden={hidden}
                    isLoading={distribution.isLoading}
                    isError={distribution.isError}
                />
            </div>
            <MonthlyComparisonBarChart
                data={monthly.data}
                hidden={hidden}
                isLoading={monthly.isLoading}
                isError={monthly.isError}
            />
            <CategoryBreakdownTable
                data={breakdown.data}
                hidden={hidden}
                isLoading={breakdown.isLoading}
                isError={breakdown.isError}
            />
        </div>
    );
}
