import { FinanceMoneyDisplay } from '@/components/clinic/finances/FinanceMoneyDisplay';
import { FinanceOpeningBalanceDialog } from '@/components/clinic/finances/FinanceOpeningBalanceDialog';
import type { MonthlySummary } from '@/domain/clinic/finance';

interface FinanceSummaryCardsProps {
    period: string;
    summary?: MonthlySummary;
    hidden: boolean;
}

export function FinanceSummaryCards({
    period,
    summary,
    hidden,
}: FinanceSummaryCardsProps) {
    return (
        <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
            <div>
                <p className="text-muted-foreground text-xs">Entradas</p>
                <p className="text-sm text-emerald-600">
                    Recebido{' '}
                    <FinanceMoneyDisplay
                        value={summary?.income.received ?? 0}
                        hidden={hidden}
                    />
                </p>
                <p className="text-muted-foreground text-xs">
                    Pendente{' '}
                    <FinanceMoneyDisplay
                        value={summary?.income.pending ?? 0}
                        hidden={hidden}
                    />
                </p>
            </div>
            <div className="border-t pt-3">
                <p className="text-muted-foreground text-xs">Saídas</p>
                <p className="text-sm text-destructive">
                    Pago{' '}
                    <FinanceMoneyDisplay
                        value={summary?.expense.paid ?? 0}
                        hidden={hidden}
                    />
                </p>
                <p className="text-muted-foreground text-xs">
                    Pendente{' '}
                    <FinanceMoneyDisplay
                        value={summary?.expense.pending ?? 0}
                        hidden={hidden}
                    />
                </p>
            </div>
            <div className="border-t pt-3">
                <p className="text-muted-foreground text-xs">Saldo geral</p>
                <p className="font-medium">
                    Disponível{' '}
                    <FinanceMoneyDisplay
                        value={summary?.available ?? 0}
                        hidden={hidden}
                    />
                </p>
                <p className="text-muted-foreground text-xs">
                    Saldo inicial{' '}
                    <FinanceOpeningBalanceDialog
                        period={period}
                        openingBalance={summary?.openingBalance ?? 0}
                        hidden={hidden}
                    />
                </p>
                <p className="text-muted-foreground text-xs">
                    Previsto{' '}
                    <FinanceMoneyDisplay
                        value={summary?.forecast ?? 0}
                        hidden={hidden}
                    />
                </p>
            </div>
        </div>
    );
}
