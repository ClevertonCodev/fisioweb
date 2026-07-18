import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

import { formatFinanceMoney } from '@/application/clinic/use-finance-values-visibility';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { MonthlyComparisonPoint } from '@/domain/clinic/finance';

import '@/components/charts/chart-setup';

interface MonthlyComparisonBarChartProps {
    data?: MonthlyComparisonPoint[];
    hidden: boolean;
    isLoading?: boolean;
    isError?: boolean;
}

export function MonthlyComparisonBarChart({
    data = [],
    hidden,
    isLoading,
    isError,
}: MonthlyComparisonBarChartProps) {
    const chartData = useMemo(
        () => ({
            labels: data.map((p) =>
                new Date(p.year, p.month - 1, 1).toLocaleDateString('pt-BR', {
                    month: 'short',
                    year: '2-digit',
                }),
            ),
            datasets: [
                {
                    label: 'Entradas',
                    data: data.map((p) => p.income),
                    backgroundColor: '#059669',
                    borderRadius: 4,
                },
                {
                    label: 'Saídas',
                    data: data.map((p) => p.expense),
                    backgroundColor: '#dc2626',
                    borderRadius: 4,
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
                        label: (ctx: {
                            dataset: { label?: string };
                            parsed: { y: number };
                        }) =>
                            `${ctx.dataset.label}: ${hidden ? '•••' : formatFinanceMoney(ctx.parsed.y, false)}`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value: number | string) =>
                            hidden
                                ? '•••'
                                : formatFinanceMoney(Number(value), false),
                    },
                },
            },
        }),
        [hidden],
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Comparativo 12 meses</CardTitle>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Não foi possível carregar o comparativo.
                    </p>
                ) : isLoading ? (
                    <Skeleton className="h-64 w-full" />
                ) : (
                    <div className="h-64">
                        <Bar data={chartData} options={chartOptions} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
