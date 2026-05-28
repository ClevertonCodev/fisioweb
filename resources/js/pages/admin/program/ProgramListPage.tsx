import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAdminPrograms, useDeleteAdminProgram } from '@/application/admin';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { AdminProgram } from '@/domain/admin';

const DEFAULT_PAGE_SIZE = 15;

const columns = [
    { title: 'ID', key: 'id', className: 'w-16' },
    { title: 'Título', key: 'title' },
    { title: 'Área', key: 'physioArea' },
    { title: 'Duração', key: 'duration', className: 'w-28' },
    { title: 'Status', key: 'status', className: 'w-24' },
    { title: 'Ações', key: 'actions', className: 'w-32 text-center' },
];

export default function ProgramListPage() {
    const navigate = useNavigate();
    const { data: programsData, isLoading, isError } = useAdminPrograms({ perPage: 200 });
    const programs: AdminProgram[] = programsData?.data ?? [];

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedStatus, setAppliedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    const deleteMutation = useDeleteAdminProgram();

    const handleDelete = (program: AdminProgram) => {
        if (!confirm(`Excluir o programa "${program.title}"?`)) return;
        deleteMutation.mutate(program.id, {
            onSuccess: () => toast.success('Programa excluído.'),
            onError: () => toast.error('Erro ao excluir programa.'),
        });
    };

    const filtered = useMemo(() => {
        return programs.filter((p) => {
            const matchesSearch =
                !appliedSearch ||
                String(p.id).includes(appliedSearch) ||
                p.title.toLowerCase().includes(appliedSearch.toLowerCase());
            const matchesStatus =
                appliedStatus === 'all' ||
                (appliedStatus === 'active' && p.isActive) ||
                (appliedStatus === 'inactive' && !p.isActive);
            return matchesSearch && matchesStatus;
        });
    }, [programs, appliedSearch, appliedStatus]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, currentPage, pageSize]);

    const handleSearch = () => {
        setAppliedSearch(search);
        setAppliedStatus(statusFilter);
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setAppliedSearch('');
        setAppliedStatus('all');
        setCurrentPage(1);
    };

    return (
        <AdminLayout>
            <div className="space-y-6 p-4 md:p-6">
                {isError && (
                    <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border px-4 py-3 text-sm">
                        Erro ao carregar programas.
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h1 className="text-foreground text-2xl font-semibold">Programas Template</h1>
                    <Button onClick={() => navigate('/admin/programas/novo')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Programa
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
                                        placeholder="ID ou título"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground text-sm">Status</Label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
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

                <DataTable<AdminProgram>
                    columns={columns}
                    data={paginatedData}
                    totalLabel="programas"
                    totalCount={filtered.length}
                    emptyMessage={isLoading ? 'Carregando...' : 'Nenhum programa encontrado.'}
                    pagination={{
                        currentPage,
                        totalPages,
                        onPageChange: (page) =>
                            setCurrentPage(Math.max(1, Math.min(page, totalPages))),
                    }}
                    pageSize={pageSize}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                >
                    {(p) => (
                        <TableRow key={p.id}>
                            <TableCell className="text-primary font-medium">{p.id}</TableCell>
                            <TableCell className="font-medium">{p.title}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {p.physioArea?.name ?? '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {p.durationMinutes ? `${p.durationMinutes} min` : '—'}
                            </TableCell>
                            <TableCell>
                                <StatusBadge variant={p.isActive ? 'active' : 'neutral'}>
                                    {p.isActive ? 'Ativo' : 'Inativo'}
                                </StatusBadge>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center justify-center gap-1">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground h-8 w-8"
                                                onClick={() => navigate(`/admin/programas/${p.id}`)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Ver detalhes</TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-muted-foreground hover:text-foreground h-8 w-8"
                                                onClick={() =>
                                                    navigate(`/admin/programas/${p.id}/editar`)
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
                                                className="text-destructive/70 hover:text-destructive h-8 w-8"
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
