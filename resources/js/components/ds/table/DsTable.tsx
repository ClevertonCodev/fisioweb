import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cva } from 'class-variance-authority';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronDown,
    Inbox,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { DsCheckbox } from '../choice/DsCheckbox';
import { DsTooltip } from '../tooltip/DsTooltip';
import { dsCn } from '../utils/ds-cn';

import type {
    SortDirection,
    TableAction,
    TableBulkAction,
    TableColumn,
    TableProps,
} from './types';

/** Ciclo do cabeçalho ordenável: asc → desc → none → asc. */
const NEXT_DIRECTION: Record<SortDirection, SortDirection> = {
    asc: 'desc',
    desc: 'none',
    none: 'asc',
};

const ARIA_SORT = {
    asc: 'ascending',
    desc: 'descending',
    none: 'none',
} as const;

const SKELETON_ROWS = 4;

const FOCUS = 'outline-none focus-visible:shadow-ds-focus';

const SKELETON =
    'block h-3.5 animate-[ds-kpi-shimmer_1.2s_ease_infinite] rounded-ds-sm bg-[linear-gradient(90deg,var(--ds-surface-subtle)_25%,var(--ds-border-subtle)_50%,var(--ds-surface-subtle)_75%)] bg-[length:200%_100%]';

const actionButton = cva(
    [
        'flex size-10 cursor-pointer items-center justify-center rounded-ds-md border border-ds-border-subtle bg-transparent text-ds-content-muted no-underline transition-[background,border-color,color] duration-[120ms] [&_svg]:size-[18px]',
        'hover:border-ds-primary-80 hover:bg-ds-surface-subtle hover:text-ds-primary-80 ds-dark:hover:border-ds-primary-60 ds-dark:hover:text-ds-primary-60',
        // pointer-events: none deixa o hover chegar ao gatilho do tooltip, que explica o disabledLabel.
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:border-ds-border-subtle disabled:bg-ds-surface-disabled disabled:text-ds-content-subtle',
        FOCUS,
    ],
    {
        variants: {
            variant: {
                default: '',
                danger: 'hover:border-ds-danger-30 hover:text-ds-danger-120 ds-dark:hover:border-ds-status-danger-border ds-dark:hover:bg-ds-status-danger-surface ds-dark:hover:text-ds-status-danger-content',
                warning:
                    'hover:border-ds-warning-30 hover:text-ds-warning-120 ds-dark:hover:border-[var(--ds-warning-80)] ds-dark:hover:text-[var(--ds-warning-80)]',
            },
            active: { true: '', false: '' },
        },
        compoundVariants: [
            {
                variant: 'warning',
                active: true,
                className:
                    'border-ds-warning-80 text-ds-warning-80 ds-dark:border-[var(--ds-warning-80)] ds-dark:text-[var(--ds-warning-80)]',
            },
        ],
        defaultVariants: { variant: 'default', active: false },
    },
);

const kebabItem = cva(
    'flex w-full cursor-pointer items-center gap-2 rounded-ds-md px-3 py-[9px] text-left font-ds text-ds-body-xs font-medium whitespace-nowrap transition-[background] duration-100 outline-none data-[disabled]:cursor-not-allowed data-[disabled]:text-ds-content-subtle data-[highlighted]:bg-ds-surface-subtle data-[disabled]:data-[highlighted]:bg-transparent [&_svg]:size-4 data-[disabled]:[&_svg]:text-ds-content-subtle',
    {
        variants: {
            variant: {
                default:
                    'text-ds-content-primary [&_svg]:text-ds-content-muted',
                danger: 'text-ds-danger-120 ds-dark:text-ds-status-danger-content ds-dark:data-[highlighted]:bg-ds-status-danger-surface [&_svg]:text-ds-danger-120 ds-dark:[&_svg]:text-ds-status-danger-content',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

function readKey<T>(row: T, key: string): unknown {
    return (row as Record<string, unknown>)[key];
}

function cellValue<T>(row: T, col: TableColumn<T>): string {
    if (col.render) return col.render(row);
    const value = readKey(row, col.key);
    return value === null || value === undefined ? '—' : String(value);
}

function isActionDisabled<T>(action: TableAction<T>, row: T): boolean {
    return action.disabled ? action.disabled(row) : false;
}

function isActionActive<T>(action: TableAction<T>, row: T): boolean {
    return action.active ? action.active(row) : false;
}

function actionLabel<T>(action: TableAction<T>, row: T): string {
    if (isActionDisabled(action, row))
        return action.disabledLabel ?? action.label;
    return isActionActive(action, row)
        ? (action.activeLabel ?? action.label)
        : action.label;
}

function actionTooltip<T>(action: TableAction<T>, row: T): string | null {
    if (typeof action.tooltip === 'function') return action.tooltip(row);
    return action.tooltip ?? actionLabel(action, row);
}

/** Atributos do link de uma ação com `href`, inline ou no menu. */
function actionLinkProps<T>(action: TableAction<T>, row: T) {
    return {
        href: action.href?.(row),
        target: action.target,
        rel: action.target === '_blank' ? 'noopener noreferrer' : undefined,
    };
}

function bulkActionLabel<T>(action: TableBulkAction<T>, count: number) {
    return `${action.label} ${count} selecionado${count > 1 ? 's' : ''}`;
}

interface RowKeys<T> {
    /** Identidade da linha na seleção: o valor de `rowKey`, ou a própria linha. */
    selection: Map<T, unknown>;
    /** Key do React por posição, sempre única. */
    react: string[];
    missing: number;
    repeated: number;
}

/**
 * Sem chave, ou com chave repetida, a linha não pode ser identificada pelo
 * valor: a seleção passa a usar a própria linha, e a key do React, a posição.
 * Assim marcar uma linha nunca marca as outras (exceto o mesmo objeto repetido
 * em `rows`, que é uma linha só para a seleção).
 */
function buildRowKeys<T>(rows: T[], rowKey: string): RowKeys<T> {
    const count = new Map<unknown, number>();
    for (const row of rows) {
        const key = readKey(row, rowKey);
        count.set(key, (count.get(key) ?? 0) + 1);
    }

    const keys: RowKeys<T> = {
        selection: new Map(),
        react: [],
        missing: 0,
        repeated: 0,
    };
    // `1` e `"1"` são chaves distintas na seleção, mas o mesmo texto na key do
    // React: a segunda que repetir o texto usa a posição.
    const usedReactKeys = new Set<string>();
    rows.forEach((row, index) => {
        const key = readKey(row, rowKey);
        const absent = key === null || key === undefined;
        if (absent) keys.missing++;
        else if ((count.get(key) ?? 0) > 1) keys.repeated++;

        const valid = !absent && count.get(key) === 1;
        keys.selection.set(row, valid ? key : row);
        // Prefixos diferentes: a key por posição nunca colide com a por valor.
        const byValue = `k:${String(key)}`;
        const free = valid && !usedReactKeys.has(byValue);
        if (free) usedReactKeys.add(byValue);
        keys.react.push(free ? byValue : `i:${index}`);
    });
    return keys;
}

/**
 * Tabela do DS, genérica no tipo da linha. Ordena (só avisa por `onSort`; quem
 * usa ordena os dados), seleciona linhas e tem ações por linha e em lote.
 */
export function DsTable<T extends object = Record<string, unknown>>({
    columns,
    rows,
    rowKey = 'id' as keyof T & string,
    selectable = true,
    actions = [],
    bulkActions = [],
    loading = false,
    emptyLabel = 'Nenhum resultado encontrado.',
    disableSelectionCb,
    onSort,
    onBulkAction,
    cells,
    className,
}: TableProps<T>) {
    const rowKeys = buildRowKeys(rows, rowKey);
    const keyOf = (row: T) => rowKeys.selection.get(row);

    useEffect(() => {
        if (!import.meta.env.DEV) return;
        if (rowKeys.missing > 0)
            console.warn(
                `[DsTable] rowKey "${rowKey}" ausente em ${rowKeys.missing} linha(s). Informe um rowKey que exista em todas as linhas.`,
            );
        if (rowKeys.repeated > 0)
            console.warn(
                `[DsTable] rowKey "${rowKey}" repetido em ${rowKeys.repeated} linha(s). Informe um rowKey único por linha.`,
            );
    }, [rowKey, rowKeys.missing, rowKeys.repeated]);

    const [selected, setSelected] = useState<Set<unknown>>(() => new Set());

    const isBlocked = (row: T) => disableSelectionCb?.(row) ?? false;
    const isRowSelected = (row: T) =>
        selected.has(keyOf(row)) && !isBlocked(row);

    const selectableRows = rows.filter((row) => !isBlocked(row));
    const selectedRows = rows.filter(isRowSelected);

    // Linha removida ou bloqueada sai da seleção (ajuste síncrono no render).
    const kept = new Set(selectedRows.map(keyOf));
    if (kept.size !== selected.size) setSelected(kept);

    const allSelected =
        selectableRows.length > 0 && selectableRows.every(isRowSelected);
    const someSelected = selectedRows.length > 0 && !allSelected;
    const visibleBulkActions = bulkActions.filter((action) =>
        action.visible ? action.visible(selectedRows) : true,
    );

    function toggleAll() {
        setSelected(
            allSelected ? new Set() : new Set(selectableRows.map(keyOf)),
        );
    }

    function toggleRow(row: T) {
        const next = new Set(kept);
        const key = keyOf(row);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setSelected(next);
    }

    const [sort, setSort] = useState<{ col: string; dir: SortDirection }>({
        col: '',
        dir: 'none',
    });

    function handleSort(col: string) {
        const dir = sort.col === col ? NEXT_DIRECTION[sort.dir] : 'asc';
        setSort({ col, dir });
        onSort?.(col, dir);
    }

    function directionOf(col: string): SortDirection {
        return sort.col === col ? sort.dir : 'none';
    }

    // Ações: as três primeiras ficam inline, o resto vai para o menu "Opções".
    const isInline = (action: TableAction<T>, index: number) =>
        action.inline ?? index < 3;
    const isVisible = (action: TableAction<T>, row: T) =>
        action.visible ? action.visible(row) : true;
    const inlineActions = (row: T) =>
        actions.filter((a, i) => isInline(a, i) && isVisible(a, row));
    const menuActions = (row: T) =>
        actions.filter((a, i) => !isInline(a, i) && isVisible(a, row));

    const colSpan =
        columns.length + (selectable ? 1 : 0) + (actions.length ? 1 : 0);

    return (
        <div
            data-ds-table=""
            className={dsCn(
                'overflow-x-auto rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default font-ds',
                className,
            )}
        >
            {selectedRows.length > 0 && visibleBulkActions.length > 0 && (
                <div
                    role="region"
                    aria-label="Ações em massa"
                    data-ds-table-bulk=""
                    className="flex animate-in flex-wrap items-center gap-3 border-b border-ds-border-brand-subtle bg-ds-surface-brand-subtle px-4 py-2.5 duration-200 fade-in-0 slide-in-from-top-2"
                >
                    <span className="text-[0.875rem] font-medium text-ds-content-brand">
                        Itens selecionados
                    </span>
                    <div className="flex flex-wrap gap-2">
                        {visibleBulkActions.map((action) => (
                            <button
                                key={action.key}
                                type="button"
                                data-ds-table-bulk-action={action.key}
                                onClick={() =>
                                    onBulkAction?.(action.key, selectedRows)
                                }
                                className={dsCn(
                                    'inline-flex cursor-pointer items-center gap-1.5 rounded-ds-md border border-ds-border-subtle bg-ds-surface-default px-3.5 py-[7px] font-ds text-[0.875rem] font-medium text-ds-content-primary transition-[background,border-color,color] duration-[120ms] hover:border-ds-primary-80 hover:bg-ds-surface-subtle hover:text-ds-content-brand ds-dark:hover:border-ds-primary-60 ds-dark:hover:text-ds-primary-40 [&_svg]:size-[15px]',
                                    FOCUS,
                                )}
                            >
                                {action.icon && (
                                    <span
                                        aria-hidden="true"
                                        className="contents"
                                    >
                                        {action.icon}
                                    </span>
                                )}
                                {bulkActionLabel(action, selectedRows.length)}
                            </button>
                        ))}
                    </div>
                    <button
                        type="button"
                        onClick={() => setSelected(new Set())}
                        className={dsCn(
                            'ml-auto cursor-pointer rounded-ds-sm border-none bg-transparent font-ds text-[0.8125rem] font-medium text-ds-content-muted hover:text-ds-content-brand',
                            FOCUS,
                        )}
                    >
                        Limpar seleção
                    </button>
                </div>
            )}

            <table
                aria-busy={loading || undefined}
                className="w-full border-collapse text-[0.875rem]"
            >
                <thead>
                    <tr className="border-b border-ds-border-subtle bg-ds-surface-subtle">
                        {selectable && (
                            <th scope="col" className="w-11 py-0 pr-2 pl-4">
                                <DsCheckbox
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    disabled={selectableRows.length === 0}
                                    onCheckedChange={toggleAll}
                                >
                                    <span className="sr-only">
                                        Selecionar todos
                                    </span>
                                </DsCheckbox>
                            </th>
                        )}

                        {columns.map((col) => {
                            const dir = directionOf(col.key);
                            const SortIcon =
                                dir === 'asc'
                                    ? ArrowUp
                                    : dir === 'desc'
                                      ? ArrowDown
                                      : ArrowUpDown;

                            return (
                                <th
                                    key={col.key}
                                    scope="col"
                                    aria-sort={
                                        col.sortable
                                            ? ARIA_SORT[dir]
                                            : undefined
                                    }
                                    data-sortable={col.sortable || undefined}
                                    style={
                                        col.width
                                            ? { width: col.width }
                                            : undefined
                                    }
                                    className={dsCn(
                                        'text-left text-[0.75rem] font-semibold whitespace-nowrap text-ds-content-muted select-none',
                                        col.sortable ? 'p-0' : 'px-4 py-[11px]',
                                    )}
                                >
                                    {col.sortable ? (
                                        <button
                                            type="button"
                                            onClick={() => handleSort(col.key)}
                                            className={dsCn(
                                                'inline-flex w-full cursor-pointer items-center gap-1 px-4 py-[11px] text-left font-semibold text-inherit hover:text-ds-content-primary [&_svg]:size-[13px]',
                                                FOCUS,
                                            )}
                                        >
                                            {col.label}
                                            <SortIcon aria-hidden="true" />
                                        </button>
                                    ) : (
                                        col.label
                                    )}
                                </th>
                            );
                        })}

                        {actions.length > 0 && (
                            <th
                                scope="col"
                                className="w-[120px] px-4 py-[11px] text-left text-[0.75rem] font-semibold whitespace-nowrap text-ds-content-muted select-none"
                            >
                                Ações
                            </th>
                        )}
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        Array.from({ length: SKELETON_ROWS }, (_, n) => (
                            <tr key={n} data-ds-table-skeleton="">
                                {selectable && (
                                    <td className="py-2.5 pr-2 pl-4">
                                        <span
                                            className={dsCn(
                                                SKELETON,
                                                'size-4 rounded-[4px]',
                                            )}
                                        />
                                    </td>
                                )}
                                {columns.map((col) => (
                                    <td key={col.key} className="px-4 py-2.5">
                                        <span className={SKELETON} />
                                    </td>
                                ))}
                                {actions.length > 0 && (
                                    <td className="px-4 py-2.5">
                                        <span
                                            className={dsCn(SKELETON, 'w-20')}
                                        />
                                    </td>
                                )}
                            </tr>
                        ))
                    ) : rows.length === 0 ? (
                        <tr>
                            <td
                                colSpan={colSpan}
                                data-ds-table-empty=""
                                className="px-4 py-12 text-center text-ds-content-subtle"
                            >
                                <Inbox
                                    aria-hidden="true"
                                    className="mx-auto mb-2 block size-8"
                                />
                                <span className="text-[0.875rem]">
                                    {emptyLabel}
                                </span>
                            </td>
                        </tr>
                    ) : (
                        rows.map((row, index) => {
                            const isSelected = isRowSelected(row);
                            const inline = inlineActions(row);
                            const menu = menuActions(row);

                            return (
                                <tr
                                    key={rowKeys.react[index]}
                                    data-selected={isSelected}
                                    className="transition-[background] duration-100 hover:bg-ds-surface-subtle data-[selected=true]:bg-[color-mix(in_srgb,var(--ds-color-primary-80)_6%,transparent)] [&:last-child>td]:border-b-0"
                                >
                                    {selectable && (
                                        <td className="w-11 border-b border-ds-border-subtle py-0 pr-2 pl-4 align-middle">
                                            <DsCheckbox
                                                checked={isSelected}
                                                disabled={isBlocked(row)}
                                                onCheckedChange={() =>
                                                    toggleRow(row)
                                                }
                                            >
                                                <span className="sr-only">
                                                    Selecionar linha
                                                </span>
                                            </DsCheckbox>
                                        </td>
                                    )}

                                    {columns.map((col) => {
                                        const value = cellValue(row, col);
                                        const renderCell = cells?.[col.key];

                                        return (
                                            <td
                                                key={col.key}
                                                className="border-b border-ds-border-subtle px-4 py-[13px] align-middle text-ds-content-primary"
                                            >
                                                {renderCell
                                                    ? renderCell({ row, value })
                                                    : value}
                                            </td>
                                        );
                                    })}

                                    {actions.length > 0 && (
                                        <td className="border-b border-ds-border-subtle px-4 py-2 align-middle">
                                            <div className="flex items-center gap-1">
                                                {inline.map((action) => (
                                                    <InlineAction
                                                        key={action.key}
                                                        action={action}
                                                        row={row}
                                                    />
                                                ))}
                                                {menu.length > 0 && (
                                                    <ActionsMenu
                                                        actions={menu}
                                                        row={row}
                                                    />
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

function InlineAction<T>({ action, row }: { action: TableAction<T>; row: T }) {
    const disabled = isActionDisabled(action, row);
    const active = isActionActive(action, row);
    const common = {
        'aria-label': actionLabel(action, row),
        'aria-pressed': action.active ? active : undefined,
        'data-variant': action.variant ?? 'default',
        'data-active': active || undefined,
        className: actionButton({ variant: action.variant, active }),
    };
    const icon = action.icon && (
        <span aria-hidden="true" className="contents">
            {action.icon}
        </span>
    );

    return (
        <DsTooltip content={actionTooltip(action, row)} placement="top">
            {action.href && !disabled ? (
                <a {...common} {...actionLinkProps(action, row)}>
                    {icon}
                </a>
            ) : (
                <button
                    {...common}
                    type="button"
                    disabled={disabled}
                    onClick={() => action.handler(row)}
                >
                    {icon}
                </button>
            )}
        </DsTooltip>
    );
}

function ActionsMenu<T>({
    actions,
    row,
}: {
    actions: TableAction<T>[];
    row: T;
}) {
    return (
        <DropdownMenu.Root modal={false}>
            {/* Convenção do DS: rótulo + chevron, nunca só ícone. */}
            <DropdownMenu.Trigger
                className={dsCn(
                    'group inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-ds-md border border-ds-border-subtle bg-ds-surface-default px-3 font-ds text-ds-caption leading-none font-medium whitespace-nowrap text-ds-content-primary transition-[background,border-color,color] duration-[120ms]',
                    'hover:border-ds-primary-80 hover:text-ds-primary-80 ds-dark:hover:border-ds-primary-60 ds-dark:hover:text-ds-primary-60',
                    'data-[state=open]:border-ds-primary-80 data-[state=open]:bg-ds-surface-brand-subtle data-[state=open]:text-ds-primary-100 ds-dark:data-[state=open]:border-ds-primary-60 ds-dark:data-[state=open]:text-ds-primary-40',
                    FOCUS,
                )}
            >
                Opções
                <ChevronDown
                    aria-hidden="true"
                    className="size-3.5 text-ds-content-muted transition-[transform,color] duration-150 group-hover:text-ds-primary-80 group-data-[state=open]:rotate-180 group-data-[state=open]:text-ds-primary-100 ds-dark:group-hover:text-ds-primary-60 ds-dark:group-data-[state=open]:text-ds-primary-40"
                />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    sideOffset={4}
                    collisionPadding={8}
                    className="z-[9999] min-w-40 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-1 shadow-ds-md data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2"
                >
                    {actions.map((action) => {
                        const disabled = isActionDisabled(action, row);
                        const content = (
                            <>
                                {action.icon && (
                                    <span
                                        aria-hidden="true"
                                        className="contents"
                                    >
                                        {action.icon}
                                    </span>
                                )}
                                {actionLabel(action, row)}
                            </>
                        );
                        const common = {
                            disabled,
                            'data-variant': action.variant ?? 'default',
                            className: kebabItem({
                                variant:
                                    action.variant === 'danger'
                                        ? 'danger'
                                        : 'default',
                            }),
                        };

                        // Com href, o item navega como a ação inline (link de verdade).
                        return action.href && !disabled ? (
                            <DropdownMenu.Item
                                key={action.key}
                                {...common}
                                asChild
                            >
                                <a {...actionLinkProps(action, row)}>
                                    {content}
                                </a>
                            </DropdownMenu.Item>
                        ) : (
                            <DropdownMenu.Item
                                key={action.key}
                                {...common}
                                onSelect={() => action.handler(row)}
                            >
                                {content}
                            </DropdownMenu.Item>
                        );
                    })}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
