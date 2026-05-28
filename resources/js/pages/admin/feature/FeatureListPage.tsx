import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLoaderData, useNavigate, useRevalidator } from 'react-router-dom';

import { featureTypes, useDeleteFeature } from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Feature } from '@/domain/admin';

const DEFAULT_PAGE_SIZE = 10;

const featureColumns = [
    { title: 'ID', key: 'id', className: 'w-16' },
    { title: 'Chave', key: 'key' },
    { title: 'Nome', key: 'name' },
    { title: 'Valor Isolado', key: 'valueIsolated' },
    { title: 'Tipo', key: 'type' },
    { title: 'Ações', key: 'actions', className: 'w-28 text-center' },
];

export default function FeatureListPage() {
    const navigate = useNavigate();
    const revalidator = useRevalidator();
    const { features, error } = useLoaderData() as { features: Feature[]; error: string | null };
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedType, setAppliedType] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
    const deleteMutation = useDeleteFeature({ onSuccess: () => revalidator.revalidate() });

    const handleDelete = (f: Feature) => {
        deleteMutation.mutate(f.id);
    };

    const filtered = useMemo(() => {
        return features.filter((f) => {
            const matchesSearch =
                !appliedSearch ||
                String(f.id).includes(appliedSearch) ||
                f.key.toLowerCase().includes(appliedSearch.toLowerCase()) ||
                f.name.toLowerCase().includes(appliedSearch.toLowerCase());
            const matchesType = appliedType === 'all' || f.type === appliedType;
            return matchesSearch && matchesType;
        });
    }, [features, appliedSearch, appliedType]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const handleSearch = () => {
        setAppliedSearch(search);
        setAppliedType(typeFilter);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearch('');
        setTypeFilter('all');
        setAppliedSearch('');
        setAppliedType('all');
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const handlePageSizeChange = (size: number) => {
        setPageSize(size);
        setCurrentPage(1);
    };

    const getTypeLabel = (type: string) =>
        featureTypes.find((t) => t.value === type)?.label ?? type;

    const formatCurrency = (value: number | null) =>
        value != null ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';

    return (
        <AdminLayout>
            <div className="space-y-6 p-4 md:p-6">
                {error && (
                    <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h1 className="text-foreground text-2xl font-semibold">Funcionalidades</h1>
                    <Button onClick={() => navigate('/admin/funcionalidades/nova')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nova Funcionalidade
                    </Button>
                </div>

                <Card>
                    <CardContent className="space-y-4 p-4">
                        <h3 className="text-foreground font-medium">Filtros</h3>
                        <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-sm">Buscar</Label>
                                <div className="relative">
                                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    <Input
                                        placeholder="ID, chave ou nome"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-sm">Tipo</Label>
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos os tipos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os tipos</SelectItem>
                                        {featureTypes.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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

                <DataTable<Feature>
                    columns={featureColumns}
                    data={paginatedData}
                    totalLabel="funcionalidades"
                    totalCount={filtered.length}
                    emptyMessage="Nenhuma funcionalidade encontrada."
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: handlePageChange,
                    }}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                >
                    {(f) => (
                        <TableRow key={f.id}>
                            <TableCell className="text-primary font-medium">{f.id}</TableCell>
                            <TableCell className="font-mono text-sm">{f.key}</TableCell>
                            <TableCell>{f.name}</TableCell>
                            <TableCell>{formatCurrency(f.valueIsolated)}</TableCell>
                            <TableCell>{getTypeLabel(f.type)}</TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer"
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/funcionalidades/${f.id}/editar`,
                                                    )
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
                                                onClick={() => handleDelete(f)}
                                                disabled={
                                                    deleteMutation.isPending &&
                                                    deleteMutation.variables === f.id
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
