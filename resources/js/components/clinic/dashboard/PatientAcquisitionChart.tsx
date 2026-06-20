import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';

import { usePatientAcquisition } from '@/application/clinic/use-dashboard';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Registro do Chart.js (efeito colateral).
import './chart-setup';

/** Rótulos amigáveis para as origens conhecidas; demais usam o valor cru. */
const SOURCE_LABELS: Record<string, string> = {
    indicacao_medica: 'Indicação médica',
    indicacao_amigo: 'Indicação de amigo',
    redes_sociais: 'Redes sociais',
    google: 'Google',
    convenio: 'Convênio',
};

const YEAR_COLORS = ['#2f6f7e', '#7fb2bd', '#c9dde1'];

function sourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
}

export function PatientAcquisitionChart() {
    const { data, isLoading, isError } = usePatientAcquisition();

    const chartData = useMemo(() => {
        if (!data) return { labels: [], datasets: [] };
        return {
            labels: data.sources.map((s) => sourceLabel(s.source)),
            datasets: data.years.map((year, i) => ({
                label: String(year),
                data: data.sources.map((s) => s.perYear[String(year)] ?? 0),
                backgroundColor: YEAR_COLORS[i % YEAR_COLORS.length],
                borderRadius: 4,
            })),
        };
    }, [data]);

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' as const } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        }),
        [],
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Captação de pacientes</CardTitle>
                <CardDescription>
                    Comparação por origem nos últimos 3 anos
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Não foi possível carregar a captação.
                    </p>
                ) : isLoading || !data ? (
                    <Skeleton className="h-64 w-full" />
                ) : data.sources.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Sem pacientes captados no período.
                    </p>
                ) : (
                    <div className="space-y-6">
                        <div className="h-64">
                            <Bar data={chartData} options={chartOptions} />
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">
                                            Origem
                                        </th>
                                        {data.years.map((year) => (
                                            <th
                                                key={year}
                                                className="px-2 py-2 text-right font-medium"
                                            >
                                                {year}
                                            </th>
                                        ))}
                                        <th className="px-2 py-2 text-right font-medium">
                                            Total
                                        </th>
                                        <th className="py-2 pl-2 text-right font-medium">
                                            %
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.sources.map((s) => (
                                        <tr
                                            key={s.source}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-2 pr-4 text-foreground">
                                                {sourceLabel(s.source)}
                                            </td>
                                            {data.years.map((year) => (
                                                <td
                                                    key={year}
                                                    className="px-2 py-2 text-right text-muted-foreground"
                                                >
                                                    {s.perYear[String(year)] ??
                                                        0}
                                                </td>
                                            ))}
                                            <td className="px-2 py-2 text-right font-medium text-foreground">
                                                {s.total}
                                            </td>
                                            <td className="py-2 pl-2 text-right text-muted-foreground">
                                                {s.percentTotal}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
