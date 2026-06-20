import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

function formatPeriodLabel(period: string) {
    const [y, m] = period.split('-').map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    });
}

function shiftPeriod(period: string, delta: number) {
    const [y, m] = period.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface FinancePeriodSelectorProps {
    period: string;
    onChange: (period: string) => void;
}

export function FinancePeriodSelector({
    period,
    onChange,
}: FinancePeriodSelectorProps) {
    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                aria-label="Mês anterior"
                onClick={() => onChange(shiftPeriod(period, -1))}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center text-sm capitalize">
                {formatPeriodLabel(period)}
            </span>
            <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                aria-label="Próximo mês"
                onClick={() => onChange(shiftPeriod(period, 1))}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}

export function currentFinancePeriod(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
