import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';

import { useClinicUsers } from '@/application/clinic/use-appointments';
import { useOccupancyRate } from '@/application/clinic/use-dashboard';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import type { OccupancyGranularity } from '@/domain/clinic/dashboard';

// Registro do Chart.js (efeito colateral).
import './chart-setup';

interface OccupancyRateChartProps {
    canChooseProfessional: boolean;
}

const GRANULARITIES: { value: OccupancyGranularity; label: string }[] = [
    { value: 'daily', label: 'Diária' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
];

export function OccupancyRateChart({
    canChooseProfessional,
}: OccupancyRateChartProps) {
    const { user } = useAuth();
    const [granularity, setGranularity] =
        useState<OccupancyGranularity>('daily');
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>(
        canChooseProfessional && user ? String(user.id) : undefined,
    );

    const { data: professionals = [] } = useClinicUsers();
    const { data, isLoading, isError } = useOccupancyRate(
        granularity,
        selectedUserId,
    );

    // Admin que atende pode escolher a si mesmo, mesmo não sendo "physiotherapist".
    const options = useMemo(() => {
        const list = professionals.map((p) => ({ id: p.id, name: p.name }));
        if (user && !list.some((p) => p.id === String(user.id))) {
            list.unshift({ id: String(user.id), name: `${user.name} (eu)` });
        }
        return list;
    }, [professionals, user]);

    const chartData = useMemo(
        () => ({
            labels: data?.buckets.map((b) => b.label) ?? [],
            datasets: [
                {
                    label: 'Ocupação',
                    data:
                        data?.buckets.map((b) => Math.round(b.rate * 100)) ?? [],
                    backgroundColor: '#2f6f7e',
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
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { callback: (value: number | string) => `${value}%` },
                },
            },
        }),
        [],
    );

    const percent = data ? Math.round(data.occupiedRate * 100) : 0;

    return (
        <Card>
            <CardHeader className="gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <CardTitle className="text-lg">Taxa de ocupação</CardTitle>
                    {canChooseProfessional && options.length > 0 && (
                        <Select
                            value={selectedUserId}
                            onValueChange={setSelectedUserId}
                        >
                            <SelectTrigger className="w-64">
                                <SelectValue placeholder="Selecione um fisioterapeuta" />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                        {percent}%
                    </span>
                    <span className="text-muted-foreground">tempo agendado</span>
                </div>
                <Tabs
                    value={granularity}
                    onValueChange={(v) =>
                        setGranularity(v as OccupancyGranularity)
                    }
                >
                    <TabsList>
                        {GRANULARITIES.map((g) => (
                            <TabsTrigger key={g.value} value={g.value}>
                                {g.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Não foi possível carregar a ocupação.
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
