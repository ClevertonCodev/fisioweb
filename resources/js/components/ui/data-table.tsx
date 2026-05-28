import type { ReactNode } from 'react';

import { Card } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { cn } from '@/lib/utils';

export interface DataTableColumn {
    title: string;
    key?: string;
    className?: string;
}

export interface DataTablePagination {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export interface DataTableProps<T = Record<string, unknown>> {
    columns: DataTableColumn[];
    data: T[];
    emptyMessage?: string;
    totalLabel?: string;

    totalCount?: number;
    pagination?: DataTablePagination;
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
    children: (item: T, index: number) => ReactNode;
    className?: string;
}

export function DataTable<T = Record<string, unknown>>({
    columns,
    data,
    emptyMessage = 'Nenhum item encontrado',
    totalLabel,
    totalCount,
    pagination,
    pageSize,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    onPageSizeChange,
    children,
    className,
}: DataTableProps<T>) {
    const total = totalCount ?? data.length;
    const showPageSizeSelect = pageSize != null && onPageSizeChange != null;

    return (
        <>
            {(totalLabel != null || pagination || showPageSizeSelect) && (
                <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                        {totalLabel != null && (
                            <span>
                                Total de <strong>{totalLabel}</strong>: <strong>{total}</strong>
                            </span>
                        )}
                        {pagination && pagination.totalPages > 1 && (
                            <span className={totalLabel != null ? 'ml-2' : ''}>
                                ( página {pagination.currentPage} de {pagination.totalPages} )
                            </span>
                        )}
                    </div>
                    {showPageSizeSelect && (
                        <div className="flex items-center gap-2">
                            <span>Itens por página</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(v) => onPageSizeChange(Number(v))}
                            >
                                <SelectTrigger className="h-8 w-[5rem]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pageSizeOptions.map((n) => (
                                        <SelectItem key={n} value={String(n)}>
                                            {n}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            )}
            <Card className={cn('mt-4 overflow-hidden', className)}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, index) => (
                                <TableHead key={col.key ?? index} className={col.className}>
                                    {col.title}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {total === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-muted-foreground py-8 text-center"
                                >
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((item, index) => children(item, index))
                        )}
                    </TableBody>
                </Table>
            </Card>
            {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <TablePagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={pagination.onPageChange}
                    />
                </div>
            )}
        </>
    );
}
