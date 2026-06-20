import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';

import { formatFinanceMoney } from '@/application/clinic/use-finance-values-visibility';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { IncomeVsExpensePoint } from '@/domain/clinic/finance';

import '@/components/charts/chart-setup';

interface IncomeVsExpenseLineChartProps {
    data?: IncomeVsExpensePoint[];
    hidden: boolean;
    isLoading?: boolean;
    isError?: boolean;
}

export function IncomeVsExpenseLineChart({
    data = [],
    hidden,
    isLoading,
    isError,
}: IncomeVsExpenseLineChartProps) {
    const chartData = useMemo(
        () => ({
            labels: data.map((p) =>
                new Date(p.date).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                }),
            ),
            datasets: [
                {
                    label: 'Entradas',
                    data: data.map((p) => p.income),
                    borderColor: '#059669',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    tension: 0.3,
                },
                {
                    label: 'Saídas',
                    data: data.map((p) => p.expense),
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.3,
                },
            ],
        }),
        [data],
    );

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' as const },
                tooltip: {
                    callbacks: {
                        label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
                            `${ctx.dataset.label}: ${hidden ? '•••' : formatFinanceMoney(ctx.parsed.y, false)}`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value: number | string) =>
                            hidden ? '•••' : formatFinanceMoney(Number(value), false),
                    },
                },
            },
        }),
        [hidden],
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Entradas × Saídas</CardTitle>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                        Não foi possível carregar o gráfico.
                    </p>
                ) : isLoading ? (
                    <Skeleton className="h-64 w-full" />
                ) : (
                    <div className="h-64">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
