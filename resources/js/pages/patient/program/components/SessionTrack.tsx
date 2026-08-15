import { Check } from 'lucide-react';
import { memo } from 'react';

import { cn } from '@/lib/utils';

export interface SessionTrackItem {
    id: string;
    name: string;
}

interface SessionTrackProps {
    items: SessionTrackItem[];
    currentIndex: number;
}

function SessionTrackComponent({ items, currentIndex }: SessionTrackProps) {
    return (
        <ol className="relative">
            <span
                aria-hidden
                className="absolute top-5 bottom-5 left-[1.375rem] w-px bg-border"
            />
            {items.map((item, index) => {
                const done = index < currentIndex;
                const current = index === currentIndex;

                return (
                    <li
                        key={item.id}
                        className="relative flex items-center gap-3 py-1.5"
                        aria-current={current ? 'step' : undefined}
                    >
                        <span
                            className={cn(
                                'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-xs transition-colors',
                                done &&
                                    'border-primary bg-primary text-primary-foreground',
                                current &&
                                    'border-primary bg-primary/10 text-primary ring-4 ring-primary/10',
                                !done &&
                                    !current &&
                                    'border-border bg-card text-muted-foreground',
                            )}
                        >
                            {done ? (
                                <Check className="h-3.5 w-3.5" />
                            ) : (
                                index + 1
                            )}
                        </span>
                        <span
                            className={cn(
                                'truncate text-sm',
                                current
                                    ? 'font-medium text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {item.name}
                        </span>
                    </li>
                );
            })}
        </ol>
    );
}

export const SessionTrack = memo(SessionTrackComponent);
