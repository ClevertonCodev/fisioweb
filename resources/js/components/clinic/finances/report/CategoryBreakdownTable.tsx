import { useMemo, useState } from 'react';

import { formatFinanceMoney } from '@/application/clinic/use-finance-values-visibility';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type {
    CategoryBreakdownRow,
    FinancialTransactionType,
} from '@/domain/clinic/finance';

interface CategoryBreakdownTableProps {
    data?: CategoryBreakdownRow[];
    hidden: boolean;
    isLoading?: boolean;
    isError?: boolean;
}

type SortKey = 'name' | 'count' | 'total' | 'percentage';

export function CategoryBreakdownTable({
    data = [],
    hidden,
    isLoading,
    isError,
}: CategoryBreakdownTableProps) {
    const [typeFilter, setTypeFilter] = useState<
        'all' | FinancialTransactionType
    >('all');
    const [sortKey, setSortKey] = useState<SortKey>('total');
    const [sortAsc, setSortAsc] = useState(false);

    const rows = useMemo(() => {
        const filtered =
            typeFilter === 'all'
                ? data
                : data.filter((r) => r.type === typeFilter);
        return [...filtered].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (typeof av === 'string' && typeof bv === 'string') {
                return sortAsc
                    ? av.localeCompare(bv)
                    : bv.localeCompare(av);
            }
            return sortAsc
                ? Number(av) - Number(bv)
                : Number(bv) - Number(av);
        });
    }, [data, typeFilter, sortKey, sortAsc]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc((v) => !v);
        else {
            setSortKey(key);
            setSortAsc(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">Detalhamento por categoria</CardTitle>
                <Select
                    value={typeFilter}
                    onValueChange={(v) =>
                        setTypeFilter(v as 'all' | FinancialTransactionType)
                    }
                >
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="entrada">Entradas</SelectItem>
                        <SelectItem value="saida">Saídas</SelectItem>
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <p className="text-muted-foreground py-4 text-center text-sm">
                        Não foi possível carregar o detalhamento.
                    </p>
                ) : isLoading ? (
                    <Skeleton className="h-48 w-full" />
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        <button
                                            type="button"
                                            className="cursor-pointer"
                                            onClick={() => toggleSort('name')}
                                        >
                                            Categoria
                                        </button>
                                    </TableHead>
                                    <TableHead>
                                        <button
                                            type="button"
                                            className="cursor-pointer"
                                            onClick={() => toggleSort('count')}
                                        >
                                            Qtd.
                                        </button>
                                    </TableHead>
                                    <TableHead>
                                        <button
                                            type="button"
                                            className="cursor-pointer"
                                            onClick={() => toggleSort('total')}
                                        >
                                            Valor
                                        </button>
                                    </TableHead>
                                    <TableHead>
                                        <button
                                            type="button"
                                            className="cursor-pointer"
                                            onClick={() =>
                                                toggleSort('percentage')
                                            }
                                        >
                                            %
                                        </button>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-muted-foreground text-center"
                                        >
                                            Sem dados para o período.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    rows.map((row) => (
                                        <TableRow key={row.categoryId}>
                                            <TableCell>{row.name}</TableCell>
                                            <TableCell>{row.count}</TableCell>
                                            <TableCell>
                                                {formatFinanceMoney(
                                                    row.total,
                                                    hidden,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {row.percentage.toFixed(1)}%
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
