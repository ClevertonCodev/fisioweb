import * as MenuPrimitive from '@radix-ui/react-dropdown-menu';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { useId, useState } from 'react';

import { dsCn } from '../utils/ds-cn';

export type DropdownMode = 'text' | 'checkbox' | 'radio';

export interface DropdownItem {
    key: string;
    label: string;
    /** Ícone do item (ex.: <Star /> do lucide). */
    icon?: ReactNode;
    badge?: string;
    disabled?: boolean;
}

export interface DropdownProps {
    items: DropdownItem[];
    /** Chave escolhida (text/radio) ou lista de chaves (checkbox). */
    value?: string | string[];
    onValueChange?: (value: string | string[]) => void;
    mode?: DropdownMode;
    placeholder?: string;
    /** Texto fixo no gatilho, independente da seleção. */
    fixedLabel?: string;
    menuTitle?: string;
    menuVariant?: 'default' | 'column-selector';
    /** Largura mínima do menu em px. Sem ela, a largura do gatilho. */
    menuWidth?: number;
    menuAlign?: 'left' | 'right';
    /** Nome acessível do gatilho. */
    label?: string;
    /** Ícone do gatilho (ex.: <Filter /> do lucide). */
    icon?: ReactNode;
}

function toKeys(value: DropdownProps['value']): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

/**
 * Menu de escolha (texto, checkbox ou radio) sobre o DropdownMenu do Radix,
 * que cuida do portal, do clique fora, do Esc, das setas e de devolver o
 * foco ao gatilho.
 */
export function DsDropdown({
    items,
    value,
    onValueChange,
    mode = 'text',
    placeholder = 'Selecionar',
    fixedLabel,
    menuTitle,
    menuVariant = 'default',
    menuWidth,
    menuAlign = 'left',
    label,
    icon,
}: DropdownProps) {
    const uid = useId();
    // Sem `value` do pai, o componente guarda a escolha sozinho.
    const [uncontrolled, setUncontrolled] = useState<string | string[]>(
        mode === 'checkbox' ? [] : '',
    );
    const selected = toKeys(value ?? uncontrolled);

    let triggerLabel = placeholder;
    if (fixedLabel) {
        triggerLabel = fixedLabel;
    } else if (selected.length) {
        const labels = items
            .filter((item) => selected.includes(item.key))
            .map((item) => item.label);
        if (labels.length) triggerLabel = labels.join(', ');
    }

    function emit(next: string | string[]) {
        if (value === undefined) setUncontrolled(next);
        onValueChange?.(next);
    }

    function toggle(key: string) {
        emit(
            selected.includes(key)
                ? selected.filter((k) => k !== key)
                : [...selected, key],
        );
    }

    const columnSelector = menuVariant === 'column-selector';

    function itemClass(item: DropdownItem, isSelected: boolean) {
        if (item.disabled) {
            return dsCn(
                ITEM_BASE,
                columnSelector && 'rounded-ds-sm px-3 py-2',
                'cursor-not-allowed bg-transparent text-ds-content-muted opacity-60',
            );
        }
        return dsCn(
            ITEM_BASE,
            'data-[highlighted]:bg-ds-surface-brand-subtle data-[highlighted]:text-ds-primary-100 ds-dark:data-[highlighted]:text-ds-primary-40',
            isSelected &&
                'bg-ds-surface-brand-subtle text-ds-primary-100 ds-dark:text-ds-primary-40',
            item.badge &&
                'bg-[image:var(--ds-gradient-brand-subtle)] font-semibold text-ds-primary-100 data-[highlighted]:brightness-[0.97] ds-dark:text-ds-primary-40',
            columnSelector &&
                'rounded-ds-sm px-3 py-2 data-[highlighted]:bg-ds-surface-subtle data-[highlighted]:text-ds-content-primary ds-dark:data-[highlighted]:text-ds-content-primary',
            columnSelector &&
                isSelected &&
                'bg-transparent text-ds-content-primary ds-dark:text-ds-content-primary',
        );
    }

    function renderContent(item: DropdownItem, isSelected: boolean) {
        const badgeId = `${uid}-${item.key}-badge`;
        return {
            // O nome do item é o rótulo; o badge vira descrição.
            'aria-label': item.label,
            'aria-describedby': item.badge ? badgeId : undefined,
            children: (
                <>
                    {mode !== 'text' && (
                        <span
                            aria-hidden="true"
                            data-slot="choice"
                            className={dsCn(
                                'grid size-[18px] shrink-0 place-items-center rounded-[5px] border border-ds-border-subtle bg-ds-surface-default transition-[background,border-color] duration-[120ms]',
                                mode === 'radio' && 'rounded-ds-pill',
                                mode === 'checkbox' &&
                                    columnSelector &&
                                    'rounded-ds-xs',
                                isSelected &&
                                    "border-ds-primary-80 bg-ds-primary-80 before:block before:content-['']",
                                isSelected &&
                                    mode === 'radio' &&
                                    'before:size-2 before:rounded-[inherit] before:bg-ds-white',
                                isSelected &&
                                    mode === 'checkbox' &&
                                    'before:h-[5px] before:w-[9px] before:-translate-y-px before:-rotate-45 before:border-b-2 before:border-l-2 before:border-ds-white',
                                isSelected &&
                                    item.disabled &&
                                    'border-ds-content-muted bg-ds-content-muted',
                            )}
                        />
                    )}
                    {item.icon && (
                        <span
                            aria-hidden="true"
                            className={dsCn(
                                'flex shrink-0 text-ds-content-muted transition-colors duration-[120ms] [&>svg]:size-[18px]',
                                !item.disabled &&
                                    'group-data-[highlighted]/item:text-ds-primary-80 ds-dark:group-data-[highlighted]/item:text-ds-primary-60',
                                !item.disabled &&
                                    item.badge &&
                                    'text-ds-primary-80 ds-dark:text-ds-primary-60',
                            )}
                        >
                            {item.icon}
                        </span>
                    )}
                    {item.label}
                    {item.badge && (
                        <span
                            id={badgeId}
                            className="ml-auto rounded-ds-pill border border-ds-primary-80/20 bg-[image:var(--ds-gradient-brand-subtle)] px-2 py-0.5 text-[0.6875rem] font-semibold text-ds-primary-100 ds-dark:border-[rgba(162,154,230,0.25)] ds-dark:text-ds-primary-40"
                        >
                            {item.badge}
                        </span>
                    )}
                </>
            ),
        };
    }

    return (
        <MenuPrimitive.Root modal={false}>
            <MenuPrimitive.Trigger
                aria-label={label}
                className="group inline-flex min-w-[140px] cursor-pointer items-center gap-2 rounded-ds-md border border-ds-border-subtle bg-ds-surface-default px-4 py-3 font-ds text-ds-body-xs whitespace-nowrap text-ds-content-primary transition-[border-color,box-shadow] duration-150 hover:border-ds-primary-50 hover:shadow-ds-focus focus-visible:border-ds-primary-50 focus-visible:shadow-ds-focus focus-visible:outline-none data-[state=open]:border-ds-primary-50 data-[state=open]:shadow-ds-focus ds-dark:hover:border-ds-primary-60 ds-dark:focus-visible:border-ds-primary-60 ds-dark:data-[state=open]:border-ds-primary-60"
            >
                {icon && (
                    <span
                        aria-hidden="true"
                        className="flex shrink-0 text-ds-content-muted [&>svg]:size-4"
                    >
                        {icon}
                    </span>
                )}
                <span className="flex-1 text-left">{triggerLabel}</span>
                <ChevronDown
                    aria-hidden="true"
                    className="size-3.5 shrink-0 text-ds-content-subtle transition-transform duration-200 group-data-[state=open]:rotate-180"
                />
            </MenuPrimitive.Trigger>

            <MenuPrimitive.Portal>
                <MenuPrimitive.Content
                    align={menuAlign === 'right' ? 'end' : 'start'}
                    sideOffset={6}
                    collisionPadding={8}
                    data-variant={menuVariant}
                    style={{
                        minWidth:
                            menuWidth !== undefined
                                ? `${menuWidth}px`
                                : 'var(--radix-dropdown-menu-trigger-width)',
                    }}
                    className={dsCn(
                        'data-[state=open]:slide-in-from-top-1.5 z-[9999] grid max-h-[max(var(--radix-dropdown-menu-content-available-height),140px)] content-start gap-0.5 overflow-y-auto overscroll-contain rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-1.5 font-ds shadow-ds-md outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
                        columnSelector && 'px-2.5 pt-2 pb-2.5',
                    )}
                >
                    {menuTitle && (
                        <MenuPrimitive.Label className="m-0 border-b border-ds-border-subtle px-2.5 pt-2 pb-2.5 text-[0.6875rem] font-semibold tracking-[0.04em] text-ds-content-muted uppercase">
                            {menuTitle}
                        </MenuPrimitive.Label>
                    )}

                    {mode === 'text' &&
                        items.map((item) => {
                            const isSelected = selected.includes(item.key);
                            return (
                                <MenuPrimitive.Item
                                    key={item.key}
                                    disabled={item.disabled}
                                    data-selected={isSelected || undefined}
                                    onSelect={() => emit(item.key)}
                                    className={itemClass(item, isSelected)}
                                    {...renderContent(item, isSelected)}
                                />
                            );
                        })}

                    {mode === 'checkbox' &&
                        items.map((item) => {
                            const isSelected = selected.includes(item.key);
                            return (
                                <MenuPrimitive.CheckboxItem
                                    key={item.key}
                                    disabled={item.disabled}
                                    checked={isSelected}
                                    data-selected={isSelected || undefined}
                                    onCheckedChange={() => toggle(item.key)}
                                    // Mantém o menu aberto para marcar vários.
                                    onSelect={(event) => event.preventDefault()}
                                    className={itemClass(item, isSelected)}
                                    {...renderContent(item, isSelected)}
                                />
                            );
                        })}

                    {mode === 'radio' && (
                        <MenuPrimitive.RadioGroup
                            value={selected[0] ?? ''}
                            onValueChange={emit}
                            className="contents"
                        >
                            {items.map((item) => {
                                const isSelected = selected[0] === item.key;
                                return (
                                    <MenuPrimitive.RadioItem
                                        key={item.key}
                                        value={item.key}
                                        disabled={item.disabled}
                                        data-selected={isSelected || undefined}
                                        className={itemClass(item, isSelected)}
                                        {...renderContent(item, isSelected)}
                                    />
                                );
                            })}
                        </MenuPrimitive.RadioGroup>
                    )}
                </MenuPrimitive.Content>
            </MenuPrimitive.Portal>
        </MenuPrimitive.Root>
    );
}

const ITEM_BASE =
    'group/item flex w-full cursor-pointer items-center gap-2.5 rounded-ds-md border-none bg-transparent px-3 py-[9px] text-left font-ds text-ds-body-xs text-ds-content-primary outline-none transition-[background,color] duration-[120ms] select-none';
