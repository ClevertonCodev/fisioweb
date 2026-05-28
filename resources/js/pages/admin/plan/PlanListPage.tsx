import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';

import { billingTypes, useDeletePlan } from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Plan } from '@/domain/admin';

const DEFAULT_PAGE_SIZE = 10;

const planColumns = [
    { title: 'ID', key: 'id', className: 'w-16' },
    { title: 'Nome', key: 'name' },
    { title: 'Tipo de Cobrança', key: 'billingType' },
    { title: 'Valor Mensal', key: 'monthlyValue' },
    { title: 'Valor Anual', key: 'annualValue' },
    { title: 'Ações', key: 'actions', className: 'w-28 text-center' },
];

export default function PlanListPage() {
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const { plans, error } = useLoaderData() as { plans: Plan[]; error: string | null };
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const deleteMutation = useDeletePlan({ onSuccess: () => revalidator.revalidate() });

    const handleDelete = (p: Plan) => {
        deleteMutation.mutate(p.id);
    };

    const filtered = useMemo(() => {
        return plans.filter((p) => {
            const matchesSearch =
                !appliedSearch ||
                String(p.id).includes(appliedSearch) ||
                p.name.toLowerCase().includes(appliedSearch.toLowerCase());
            return matchesSearch;
        });
    }, [plans, appliedSearch]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const handleSearch = () => {
        setAppliedSearch(search);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearch('');
        setAppliedSearch('');
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const getBillingLabel = (type: string) =>
        billingTypes.find((t) => t.value === type)?.label ?? type;

    const formatCurrency = (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <AdminLayout>
            <div className="space-y-6 p-4 md:p-6">
                {error && (
                    <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h1 className="text-foreground text-2xl font-semibold">Planos</h1>
                    <Button onClick={() => navigate('/admin/planos/novo')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Plano
                    </Button>
                </div>

                <Card>
                    <CardContent className="space-y-4 p-4">
                        <h3 className="text-foreground font-medium">Filtros</h3>
                        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-muted-foreground text-sm">Buscar</Label>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        placeholder="ID ou nome do plano"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSearch}>Buscar</Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Limpar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <DataTable<Plan>
                    columns={planColumns}
                    data={paginatedData}
                    totalLabel="planos"
                    totalCount={filtered.length}
                    emptyMessage="Nenhum plano encontrado."
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: handlePageChange,
                    }}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                >
                    {(p) => (
                        <TableRow key={p.id}>
                            <TableCell className="text-primary font-medium">{p.id}</TableCell>
                            <TableCell>{p.name}</TableCell>
                            <TableCell>{getBillingLabel(p.billingType)}</TableCell>
                            <TableCell>{formatCurrency(p.monthlyValue)}</TableCell>
                            <TableCell>{formatCurrency(p.annualValue)}</TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer"
                                                onClick={() =>
                                                    navigate(`/admin/planos/${p.id}/editar`)
                                                }
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Editar</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive/70 hover:text-destructive h-8 w-8 cursor-pointer"
                                                onClick={() => handleDelete(p)}
                                                disabled={
                                                    deleteMutation.isPending &&
                                                    deleteMutation.variables === p.id
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Excluir</TooltipContent>
                                    </Tooltip>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </DataTable>
            </div>
        </AdminLayout>
    );
}
