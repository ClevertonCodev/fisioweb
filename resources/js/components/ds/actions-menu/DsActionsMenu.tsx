import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';

import { DsTooltip } from '../tooltip/DsTooltip';
import { dsCn } from '../utils/ds-cn';

export interface ActionsMenuItem {
    key: string;
    label: string;
    icon?: ReactNode;
    danger?: boolean;
    disabled?: boolean;
    disabledReason?: string;
}

const itemClass =
    'flex w-full cursor-pointer items-center gap-2 rounded-ds-md px-3 py-[9px] text-left font-ds text-ds-body-xs font-medium whitespace-nowrap outline-none transition-[background] duration-100 data-disabled:cursor-not-allowed data-disabled:opacity-40 data-[highlighted]:bg-ds-surface-subtle data-disabled:data-[highlighted]:bg-transparent [&_svg]:size-4';

export function DsActionsMenu({
    items,
    onSelect,
    trigger,
    label = 'Mais ações',
}: {
    items: ActionsMenuItem[];
    onSelect: (key: string) => void;
    trigger?: ReactNode;
    label?: string;
}) {
    return (
        <DropdownMenu.Root modal={false}>
            <DsTooltip content={label} asChild>
                <DropdownMenu.Trigger asChild>
                    {trigger ?? (
                        <button
                            type="button"
                            aria-label={label}
                            className="flex size-9 cursor-pointer items-center justify-center rounded-ds-md text-ds-content-secondary transition-colors hover:bg-ds-surface-brand-subtle hover:text-ds-content-brand focus-visible:shadow-ds-focus focus-visible:outline-0 data-[state=open]:bg-ds-surface-brand-subtle ds-dark:hover:text-ds-primary-60 [&_svg]:size-4"
                        >
                            <MoreHorizontal />
                        </button>
                    )}
                </DropdownMenu.Trigger>
            </DsTooltip>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    collisionPadding={8}
                    className="z-[9999] min-w-48 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-1 font-ds shadow-ds-md"
                >
                    {items.map((item) => {
                        const row = (
                            <DropdownMenu.Item
                                key={item.key}
                                disabled={item.disabled}
                                onSelect={() => {
                                    if (!item.disabled) onSelect(item.key);
                                }}
                                className={dsCn(
                                    itemClass,
                                    item.danger
                                        ? 'text-ds-danger-120 ds-dark:text-ds-status-danger-content [&_svg]:text-current'
                                        : 'text-ds-content-primary [&_svg]:text-ds-content-muted',
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </DropdownMenu.Item>
                        );
                        if (item.disabled && item.disabledReason) {
                            return (
                                <DsTooltip
                                    key={item.key}
                                    content={item.disabledReason}
                                    asChild
                                >
                                    <div>{row}</div>
                                </DsTooltip>
                            );
                        }
                        return row;
                    })}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
