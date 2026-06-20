import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

import { formatFinanceMoney } from '@/application/clinic/use-finance-values-visibility';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReportSummary } from '@/domain/clinic/finance';

interface ReportCardsProps {
    data?: ReportSummary;
    hidden: boolean;
    isLoading?: boolean;
    isError?: boolean;
}

function VariationBadge({ value }: { value: number | null }) {
    if (value === null) {
        return (
            <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                <Minus className="h-3 w-3" /> —
            </span>
        );
    }
    const positive = value >= 0;
    return (
        <span
            className={`inline-flex items-center gap-1 text-xs ${positive ? 'text-emerald-600' : 'text-destructive'}`}
        >
            {positive ? (
                <ArrowUp className="h-3 w-3" />
            ) : (
                <ArrowDown className="h-3 w-3" />
            )}
            {Math.abs(value).toFixed(1)}%
        </span>
    );
}

export function ReportCards({
    data,
    hidden,
    isLoading,
    isError,
}: ReportCardsProps) {
    if (isError) {
        return (
            <p className="text-muted-foreground py-4 text-center text-sm">
                Não foi possível carregar os totais do relatório.
            </p>
        );
    }

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-28 w-full" />
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: 'Entradas',
            value: data?.totals.income ?? 0,
            variation: data?.variation.income ?? null,
            tone: 'text-emerald-600',
        },
        {
            title: 'Saídas',
            value: data?.totals.expense ?? 0,
            variation: data?.variation.expense ?? null,
            tone: 'text-destructive',
        },
        {
            title: 'Saldo',
            value: data?.totals.balance ?? 0,
            variation: data?.variation.balance ?? null,
            tone: 'text-foreground',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-3">
            {cards.map((card) => (
                <Card key={card.title}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">
                            {card.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-2xl font-bold ${card.tone}`}>
                            {formatFinanceMoney(card.value, hidden)}
                        </p>
                        <div className="mt-2">
                            <span className="text-muted-foreground text-xs">
                                vs. mês anterior{' '}
                            </span>
                            <VariationBadge value={card.variation} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
