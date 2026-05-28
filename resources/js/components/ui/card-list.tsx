import type { ReactNode } from 'react';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';

export interface CardListPagination {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export interface CardListProps<T = Record<string, unknown>> {
    data: T[];
    emptyMessage?: string;
    totalLabel?: string;
    totalCount?: number;
    pagination?: CardListPagination;
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
    children: (item: T, index: number) => ReactNode;
    className?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

export function CardList<T = Record<string, unknown>>({
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
}: CardListProps<T>) {
    const total = totalCount ?? data.length;
    const showPageSizeSelect = pageSize != null && onPageSizeChange != null;

    return (
        <div className={className}>
            {(totalLabel != null || pagination || showPageSizeSelect) && (
                <div className="text-muted-foreground mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
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

            {total === 0 ? (
                <div className="text-muted-foreground py-8 text-center text-sm">{emptyMessage}</div>
            ) : (
                <div className="space-y-2">{data.map((item, index) => children(item, index))}</div>
            )}

            {pagination && pagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center">
                    <TablePagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={pagination.onPageChange}
                    />
                </div>
            )}
        </div>
    );
}
