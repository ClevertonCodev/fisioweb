import { formatFinanceMoney } from '@/application/clinic/use-finance-values-visibility';

interface FinanceMoneyDisplayProps {
    value: number;
    hidden: boolean;
    className?: string;
}

export function FinanceMoneyDisplay({
    value,
    hidden,
    className,
}: FinanceMoneyDisplayProps) {
    return (
        <span className={className}>{formatFinanceMoney(value, hidden)}</span>
    );
}
