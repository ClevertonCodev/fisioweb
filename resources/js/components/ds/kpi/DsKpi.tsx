import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import type { ReactNode } from 'react';

import { dsCn } from '../utils/ds-cn';

export type KpiTrend = 'up' | 'down' | 'neutral';

export interface KpiProps {
    label: string;
    value: string | number;
    delta?: string;
    trend?: KpiTrend;
    icon?: ReactNode;
    loading?: boolean;
    className?: string;
}

const TREND: Record<
    KpiTrend,
    { icon: ReactNode; text: string; className: string }
> = {
    up: {
        icon: <TrendingUp />,
        text: 'Alta',
        className:
            'text-[var(--ds-color-success-content)] ds-dark:text-ds-status-success-content',
    },
    down: {
        icon: <TrendingDown />,
        text: 'Queda',
        className:
            'text-[var(--ds-color-danger-content)] ds-dark:text-ds-status-danger-content',
    },
    neutral: {
        icon: <Minus />,
        text: 'Estável',
        className: 'text-ds-content-muted',
    },
};

export function DsKpi({
    label,
    value,
    delta,
    trend = 'neutral',
    icon,
    loading = false,
    className,
}: KpiProps) {
    const trendInfo = TREND[trend];

    return (
        <div
            aria-busy={loading || undefined}
            className={dsCn(
                'flex flex-col gap-2 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-5 font-ds',
                className,
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span className="text-[0.8125rem] leading-[1.3] font-medium text-ds-content-muted">
                    {label}
                </span>
                {icon && (
                    <span
                        aria-hidden="true"
                        className="flex size-8 shrink-0 items-center justify-center rounded-ds-md bg-ds-surface-subtle text-ds-content-muted [&_svg]:size-4"
                    >
                        {icon}
                    </span>
                )}
            </div>

            <div className="min-h-8">
                {loading ? (
                    <span
                        data-testid="ds-kpi-skeleton"
                        className="block h-8 w-[120px] animate-[ds-kpi-shimmer_1.2s_ease_infinite] rounded-ds-md bg-[linear-gradient(90deg,var(--ds-surface-subtle)_25%,var(--ds-border-subtle)_50%,var(--ds-surface-subtle)_75%)] bg-[length:200%_100%]"
                    />
                ) : (
                    <span className="text-[1.75rem] leading-[1.2] font-bold tracking-[-0.5px] text-ds-content-primary">
                        {value}
                    </span>
                )}
            </div>

            {delta && (
                <div
                    data-trend={trend}
                    className={dsCn(
                        'inline-flex items-center gap-1 text-[0.8125rem] font-medium [&_svg]:size-3.5',
                        trendInfo.className,
                    )}
                >
                    <span aria-hidden="true" className="contents">
                        {trendInfo.icon}
                    </span>
                    <span className="sr-only">{trendInfo.text}</span>
                    <span>{delta}</span>
                </div>
            )}
        </div>
    );
}
