import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { dsCn } from '../utils/ds-cn';

export type TabsSize = 'sm' | 'md' | 'lg';

export interface Tab {
    key: string;
    label: string;
    icon?: ReactNode;
    disabled?: boolean;
}

export interface TabsProps {
    tabs: Tab[];
    /** Aba ativa (no Vue: modelValue). Sem valor, a primeira aba. */
    value?: string;
    onValueChange?: (key: string) => void;
    size?: TabsSize;
    className?: string;
    'aria-label'?: string;
    /** Painéis opcionais (DsTabsPanel). O DS Vue só tinha a barra de abas. */
    children?: ReactNode;
}

const SIZE_CLASSES: Record<TabsSize, string> = {
    sm: 'px-3 py-[7px] text-ds-caption [&_svg]:size-4',
    md: 'px-4 py-2 text-ds-body-xs [&_svg]:size-[18px]',
    lg: 'px-5 py-3 text-ds-body-sm [&_svg]:size-5',
};

/** Barra de abas sobre o Tabs do Radix (setas trocam a aba, pulando as desabilitadas). */
export function DsTabs({
    tabs,
    value,
    onValueChange,
    size = 'md',
    className,
    children,
    ...aria
}: TabsProps) {
    const [internal, setInternal] = useState(tabs[0]?.key);
    const active = value ?? internal ?? tabs[0]?.key;

    function handleChange(key: string) {
        setInternal(key);
        onValueChange?.(key);
    }

    return (
        <TabsPrimitive.Root value={active} onValueChange={handleChange}>
            <TabsPrimitive.List
                {...aria}
                data-size={size}
                className={dsCn(
                    'flex w-full max-w-full items-center gap-1 overflow-x-auto overflow-y-hidden rounded-[12px] border border-ds-border-subtle bg-ds-surface-subtle p-1 font-ds [scrollbar-width:none]',
                    className,
                )}
            >
                {tabs.map((tab) => (
                    <TabsPrimitive.Trigger
                        key={tab.key}
                        value={tab.key}
                        disabled={tab.disabled}
                        className={dsCn(
                            'inline-flex flex-[1_0_0] cursor-pointer items-center justify-center gap-2 rounded-ds-md border-none bg-transparent leading-[var(--ds-line-height-heading)] font-medium whitespace-nowrap text-ds-content-muted transition-[background-color,color,box-shadow] duration-150',
                            'focus-visible:shadow-ds-focus focus-visible:outline-0 enabled:hover:text-ds-content-secondary',
                            'data-[state=active]:bg-ds-surface-default data-[state=active]:text-ds-content-brand data-[state=active]:shadow-ds-xs data-[state=active]:hover:text-ds-content-brand',
                            'disabled:cursor-not-allowed disabled:opacity-40',
                            SIZE_CLASSES[size],
                        )}
                    >
                        {tab.icon && (
                            <span aria-hidden="true" className="contents">
                                {tab.icon}
                            </span>
                        )}
                        {tab.label}
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>
            {children}
        </TabsPrimitive.Root>
    );
}

export function DsTabsPanel({
    value,
    className,
    children,
}: {
    value: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <TabsPrimitive.Content
            value={value}
            className={dsCn('pt-4 font-ds outline-none', className)}
        >
            {children}
        </TabsPrimitive.Content>
    );
}
