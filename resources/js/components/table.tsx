import { type ReactNode } from 'react';

import { Pagination } from './pagination';

interface TableColumn {
    title: string;
    key?: string;
    className?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface TableProps<T = Record<string, unknown>> {
    columns: TableColumn[];
    data: T[];
    emptyMessage?: string;
    children: (item: T, index: number) => ReactNode;
    pagination?: {
        links: PaginationLink[];
        total: number;
        currentCount: number;
        label?: string;
        lastPage: number;
        currentPage: number;
    };
}

export function Table<T = Record<string, unknown>>({
    columns,
    data,
    emptyMessage = 'Nenhum item encontrado',
    children,
    pagination,
}: TableProps<T>) {
    return (
        <>
            {pagination && (
                <div className="text-sm">
                    <b>Total de {pagination.label}: {pagination.total}</b> ( {pagination.currentPage} de {pagination.lastPage} páginas )
                </div>
            )}
            <div className="rounded-xl border border-sidebar-border/70 bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-sidebar-border/70">
                                {columns.map((column, index) => (
                                    <th
                                        key={column.key || index}
                                        className={`px-4 py-3 text-left text-sm font-semibold ${column.className || ''}`}
                                    >
                                        {column.title}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        {emptyMessage}
                                    </td>
                                </tr>
                            ) : (
                                data.map((item, index) => children(item, index))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {pagination && pagination.lastPage > 1 && (
                <Pagination
                    links={pagination.links}
                    total={pagination.total}
                    currentCount={pagination.currentCount}
                    label={pagination.label}
                />
            )}
        </>
    );
}
