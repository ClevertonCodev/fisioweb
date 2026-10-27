import { memo } from 'react';

import { cn } from '@/lib/utils';

interface SeriesTrackerProps {
    total: number;
    current: number;
}

function SeriesTrackerComponent({ total, current }: SeriesTrackerProps) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2" role="list">
                {Array.from({ length: total }).map((_, index) => (
                    <span
                        key={index}
                        role="listitem"
                        aria-label={`Série ${index + 1}${index < current ? ' concluída' : ''}`}
                        className={cn(
                            'h-3 w-3 rounded-full transition-colors',
                            index < current
                                ? 'bg-primary'
                                : 'bg-primary/15 ring-1 ring-primary/30 ring-inset',
                        )}
                    />
                ))}
            </div>
            <span className="text-sm text-muted-foreground">
                Série{' '}
                <span className="font-mono font-semibold text-foreground">
                    {Math.min(current, total)}
                </span>{' '}
                de <span className="font-mono">{total}</span>
            </span>
        </div>
    );
}

export const SeriesTracker = memo(SeriesTrackerComponent);
