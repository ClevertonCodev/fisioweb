import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { dsCn } from '../utils/ds-cn';

export type CollapseMode = 'default' | 'step';

export interface CollapseItem {
    key: string;
    title: string;
    subtitle?: string;
    /** Conteúdo do item aberto (no Vue, um slot com o nome do key). */
    content?: ReactNode;
}

export interface CollapseProps {
    items?: CollapseItem[];
    /**
     * Item aberto. `undefined` = não controlado; qualquer outro valor
     * (inclusive `null`) = controlado pelo pai, como no Vue.
     */
    value?: string | null;
    onValueChange?: (key: string | null) => void;
    mode?: CollapseMode;
    currentStep?: number;
    className?: string;
}

type StepState = 'done' | 'current' | 'pending';

/**
 * Lista de seções recolhíveis, uma aberta por vez. Sobre o Accordion do Radix
 * (Enter/Espaço abrem e fecham, setas passam de um título para outro).
 */
export function DsCollapse({
    items = [],
    value,
    onValueChange,
    mode = 'default',
    currentStep = 0,
    className,
}: CollapseProps) {
    const [internalOpen, setInternalOpen] = useState<string | null>(null);
    const openKey = value !== undefined ? value : internalOpen;

    function stepState(index: number): StepState {
        if (index < currentStep) return 'done';
        if (index === currentStep) return 'current';
        return 'pending';
    }

    function handleChange(next: string) {
        const key = next === '' ? null : next;
        setInternalOpen(key);
        onValueChange?.(key);
    }

    return (
        <AccordionPrimitive.Root
            type="single"
            collapsible
            value={openKey ?? ''}
            onValueChange={handleChange}
            className={dsCn(
                'flex flex-col overflow-hidden rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default font-ds',
                className,
            )}
        >
            {items.map((item, index) => {
                const state = mode === 'step' ? stepState(index) : undefined;
                const isOpen = openKey === item.key;

                return (
                    <AccordionPrimitive.Item
                        key={item.key}
                        value={item.key}
                        className="bg-ds-surface-default [&+&]:border-t [&+&]:border-ds-border-subtle"
                    >
                        <AccordionPrimitive.Header asChild>
                            <div>
                                <AccordionPrimitive.Trigger
                                    data-step={state}
                                    className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3.5 text-left font-ds transition-colors duration-150 hover:bg-ds-surface-subtle focus-visible:shadow-ds-focus focus-visible:outline-0"
                                >
                                    {state && (
                                        <span
                                            className={dsCn(
                                                'inline-flex size-[30px] shrink-0 items-center justify-center rounded-ds-pill bg-ds-surface-subtle text-ds-body-xs leading-none font-semibold text-ds-content-muted transition-colors duration-200 [&_svg]:size-3.5',
                                                state === 'done' &&
                                                    'bg-ds-primary-80 text-ds-white',
                                                state === 'current' &&
                                                    'bg-ds-surface-brand-subtle text-ds-content-brand',
                                            )}
                                        >
                                            {state === 'done' ? (
                                                <Check
                                                    data-testid="ds-step-check"
                                                    aria-hidden="true"
                                                />
                                            ) : (
                                                index + 1
                                            )}
                                        </span>
                                    )}
                                    <span
                                        className={dsCn(
                                            'flex-1 text-ds-body-sm leading-[var(--ds-line-height-heading)] font-medium text-ds-content-secondary',
                                            state === 'done' &&
                                                'text-ds-content-brand',
                                            state === 'current' &&
                                                isOpen &&
                                                'font-semibold text-ds-content-brand',
                                        )}
                                    >
                                        {item.title}
                                    </span>
                                    <ChevronDown
                                        aria-hidden="true"
                                        className={dsCn(
                                            'size-[18px] shrink-0 text-ds-content-subtle transition-transform duration-200',
                                            isOpen && 'rotate-180',
                                        )}
                                    />
                                </AccordionPrimitive.Trigger>
                            </div>
                        </AccordionPrimitive.Header>
                        <AccordionPrimitive.Content className="px-4 pb-4 text-ds-body-xs leading-[var(--ds-line-height-base)] text-ds-content-muted">
                            {item.content}
                        </AccordionPrimitive.Content>
                    </AccordionPrimitive.Item>
                );
            })}
        </AccordionPrimitive.Root>
    );
}
