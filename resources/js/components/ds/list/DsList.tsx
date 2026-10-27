import type { ReactNode } from 'react';

import { dsCn } from '../utils/ds-cn';

export type ListMode = 'text' | 'kv';

export interface ListItem {
    key?: string;
    icon?: ReactNode;
    text?: string;
    sub?: string;
    meta?: string;
    label?: string;
    value?: string;
}

export interface ListProps {
    items: ListItem[];
    mode?: ListMode;
    /** Modo kv: valor customizado por item. */
    renderValue?: (item: ListItem, index: number) => ReactNode;
    className?: string;
}

export function DsList({
    items,
    mode = 'text',
    renderValue,
    className,
}: ListProps) {
    return (
        <ul
            data-mode={mode}
            className={dsCn(
                'm-0 flex list-none flex-col p-0 font-ds',
                className,
            )}
        >
            {items.map((item, index) => (
                <li
                    key={item.key ?? index}
                    className={dsCn(
                        'flex items-center gap-3 border-b border-ds-border-subtle last:border-b-0',
                        mode === 'kv' ? 'py-3' : 'py-3.5',
                    )}
                >
                    {mode === 'text' ? (
                        <>
                            {item.icon && (
                                <span
                                    aria-hidden="true"
                                    className="flex size-9 shrink-0 items-center justify-center rounded-ds-md bg-ds-surface-subtle text-ds-content-muted [&_svg]:size-[18px]"
                                >
                                    {item.icon}
                                </span>
                            )}
                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="text-[0.875rem] leading-[1.4] font-medium text-ds-content-primary">
                                    {item.text}
                                </span>
                                {item.sub && (
                                    <span className="text-[0.8125rem] text-ds-content-muted">
                                        {item.sub}
                                    </span>
                                )}
                            </div>
                            {item.meta && (
                                <span className="shrink-0 text-[0.8125rem] text-ds-content-subtle">
                                    {item.meta}
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="min-w-[140px] shrink-0 text-[0.8125rem] text-ds-content-muted">
                                {item.label}
                            </span>
                            <span className="flex-1 text-right text-[0.875rem] font-medium text-ds-content-primary">
                                {renderValue
                                    ? renderValue(item, index)
                                    : item.value}
                            </span>
                        </>
                    )}
                </li>
            ))}
        </ul>
    );
}
