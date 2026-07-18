import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';

import { formatFinanceMoney } from '@/application/clinic/use-finance-values-visibility';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoryDistributionPoint } from '@/domain/clinic/finance';

import '@/components/charts/chart-setup';

const COLORS = ['#2f6f7e', '#059669', '#0ea5e9', '#a855f7', '#f59e0b'];

interface CategoryDistributionPieChartProps {
    data?: CategoryDistributionPoint[];
    hidden: boolean;
    isLoading?: boolean;
    isError?: boolean;
}

export function CategoryDistributionPieChart({
    data = [],
    hidden,
    isLoading,
    isError,
}: CategoryDistributionPieChartProps) {
    const chartData = useMemo(
        () => ({
            labels: data.map((p) => p.name),
            datasets: [
                {
                    data: data.map((p) => p.total),
                    backgroundColor: data.map(
                        (_, i) => COLORS[i % COLORS.length],
                    ),
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
                legend: { position: 'right' as const },
                tooltip: {
                    callbacks: {
                        label: (ctx: {
                            label?: string;
                            parsed: unknown;
                            dataIndex: number;
                        }) => {
                            const point = data[ctx.dataIndex];
                            const raw = Number(ctx.parsed);
                            const pct = point?.percentage ?? 0;
                            return `${ctx.label}: ${hidden ? '•••' : formatFinanceMoney(raw, false)} (${pct.toFixed(1)}%)`;
                        },
                    },
                },
            },
        }),
        [data, hidden],
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Top categorias</CardTitle>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Não foi possível carregar a distribuição.
                    </p>
                ) : isLoading ? (
                    <Skeleton className="h-64 w-full" />
                ) : data.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Sem dados para o período.
                    </p>
                ) : (
                    <div className="h-64">
                        <Doughnut data={chartData} options={chartOptions} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
