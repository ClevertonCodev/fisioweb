import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    useCancelClinic,
    useClinics,
    useLoginAsClinic,
    usePlansOptions,
} from '@/application/admin';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
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
import type { Clinic } from '@/domain/admin';
import { formatDocument } from '@/lib/utils';

const CLINICS_COLUMNS: DataTableColumn[] = [
    { title: 'ID', key: 'id', className: 'w-16' },
    { title: 'Nome', key: 'name' },
    { title: 'Documento', key: 'document' },
    { title: 'Plano', key: 'planName' },
    { title: 'Status', key: 'status' },
    { title: 'Data de Criação', key: 'createdAt' },
    { title: 'Ações', key: 'actions', className: 'text-center' },
];

export default function ClinicListPage() {
    const navigate = useNavigate();
    const { data: clinics = [] } = useClinics();
    const { data: plansOptions = [] } = usePlansOptions();
    const loginAsMutation = useLoginAsClinic();
    const cancelMutation = useCancelClinic();

    const handleCancel = (clinic: Clinic) => {
        if (!window.confirm(`Cancelar a clínica "${clinic.name}"?`)) return;
        cancelMutation.mutate(clinic.id);
    };

    const handleLoginAs = (clinic: Clinic) => {
        loginAsMutation.mutate(clinic.id, {
            onSuccess: (res) => {
                const key = `_imp_${Date.now()}`;
                localStorage.setItem(
                    key,
                    JSON.stringify({ token: res.access_token, guard: 'clinic', user: res.user }),
                );
                window.open(`/clinica/entrar?key=${key}`, '_blank');
            },
        });
    };
    const [search, setSearch] = useState('');
    const [planFilter, setPlanFilter] = useState('todos');
    const [statusFilter, setStatusFilter] = useState('todos');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState('10');
    const [currentPage, setCurrentPage] = useState(1);

    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedPlan, setAppliedPlan] = useState('todos');
    const [appliedStatus, setAppliedStatus] = useState('todos');
    const [appliedDateFrom, setAppliedDateFrom] = useState('');
    const [appliedDateTo, setAppliedDateTo] = useState('');

    const handleSearch = () => {
        setAppliedSearch(search);
        setAppliedPlan(planFilter);
        setAppliedStatus(statusFilter);
        setAppliedDateFrom(dateFrom);
        setAppliedDateTo(dateTo);
        setCurrentPage(1);
    };

    const handleClear = () => {
        setSearch('');
        setPlanFilter('todos');
        setStatusFilter('todos');
        setDateFrom('');
        setDateTo('');
        setAppliedSearch('');
        setAppliedPlan('todos');
        setAppliedStatus('todos');
        setAppliedDateFrom('');
        setAppliedDateTo('');
        setCurrentPage(1);
    };

    const filtered = clinics.filter((c) => {
        if (
            appliedSearch &&
            !c.name.toLowerCase().includes(appliedSearch.toLowerCase()) &&
            !c.document.includes(appliedSearch) &&
            !String(c.id).includes(appliedSearch)
        )
            return false;
        if (appliedPlan !== 'todos' && String(c.planId) !== appliedPlan) return false;
        if (appliedStatus !== 'todos' && String(c.status) !== appliedStatus) return false;
        if (appliedDateFrom) {
            const from = new Date(appliedDateFrom);
            if (new Date(c.createdAt) < from) return false;
        }
        if (appliedDateTo) {
            const to = new Date(appliedDateTo);
            to.setHours(23, 59, 59);
            if (new Date(c.createdAt) > to) return false;
        }
        return true;
    });

    const perPage = parseInt(itemsPerPage, 10);
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
    const paginated = useMemo(
        () => filtered.slice((currentPage - 1) * perPage, currentPage * perPage),
        [filtered, currentPage, perPage],
    );

    const pagination =
        totalPages <= 1
            ? undefined
            : {
                  currentPage,
                  totalPages,
                  onPageChange: setCurrentPage,
              };

    const handlePageSizeChange = (size: number) => {
        setItemsPerPage(String(size));
        setCurrentPage(1);
    };

    return (
        <AdminLayout>
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="bg-background/95 border-border sticky top-0 z-10 border-b backdrop-blur">
                    <div className="px-6 py-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-foreground text-2xl font-semibold">Clínicas</h1>
                            <Button
                                className="gap-2"
                                onClick={() => navigate('/admin/clinicas/nova')}
                            >
                                <Plus className="h-4 w-4" />
                                Nova Clínica
                            </Button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Filters Card */}
                    <Card className="mb-6">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-semibold">Filtros</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
                                <div className="space-y-1.5">
                                    <label className="text-foreground text-sm font-medium">
                                        Buscar
                                    </label>
                                    <div className="relative">
                                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        <Input
                                            placeholder="ID, nome ou documento"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-foreground text-sm font-medium">
                                        Plano
                                    </label>
                                    <Select
                                        value={planFilter}
                                        onValueChange={(v) => setPlanFilter(v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos os planos" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todos os planos</SelectItem>
                                            {plansOptions.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-foreground text-sm font-medium">
                                        Data de
                                    </label>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-foreground text-sm font-medium">
                                        Data até
                                    </label>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-foreground text-sm font-medium">
                                        Status
                                    </label>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(v) => setStatusFilter(v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos os status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todos">Todos os status</SelectItem>
                                            <SelectItem value="1">Ativo</SelectItem>
                                            <SelectItem value="0">Inativo</SelectItem>
                                            <SelectItem value="-1">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                <Button onClick={handleSearch}>Buscar</Button>
                                <Button variant="outline" onClick={handleClear}>
                                    Limpar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table with built-in pagination */}
                    <DataTable<Clinic>
                        columns={CLINICS_COLUMNS}
                        data={paginated}
                        emptyMessage="Nenhuma clínica encontrada."
                        totalLabel="clínicas"
                        totalCount={filtered.length}
                        pagination={pagination}
                        pageSize={perPage}
                        pageSizeOptions={[10, 25, 50]}
                        onPageSizeChange={handlePageSizeChange}
                    >
                        {(clinic) => (
                            <TableRow key={clinic.id}>
                                <TableCell className="text-foreground font-medium">
                                    {clinic.id}
                                </TableCell>
                                <TableCell>
                                    <button
                                        className="text-primary text-left font-medium hover:underline"
                                        onClick={() => navigate(`/admin/clinicas/${clinic.id}`)}
                                    >
                                        {clinic.name}
                                    </button>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDocument(clinic.document)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {clinic.planName ?? '—'}
                                </TableCell>
                                <TableCell>
                                    <StatusBadge
                                        variant={
                                            clinic.status === 1
                                                ? 'active'
                                                : clinic.status === 0
                                                  ? 'neutral'
                                                  : 'danger'
                                        }
                                    >
                                        {clinic.status === 1
                                            ? 'Ativo'
                                            : clinic.status === 0
                                              ? 'Inativo'
                                              : 'Cancelado'}
                                    </StatusBadge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(clinic.createdAt).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                    })}{' '}
                                    {new Date(clinic.createdAt).toLocaleTimeString('pt-BR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer"
                                                    disabled={loginAsMutation.isPending}
                                                    onClick={() => handleLoginAs(clinic)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Logar na clínica</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-foreground h-8 w-8 cursor-pointer"
                                                    onClick={() =>
                                                        navigate(
                                                            `/admin/clinicas/${clinic.id}/editar`,
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
                                                    disabled={
                                                        clinic.status === -1 ||
                                                        cancelMutation.isPending
                                                    }
                                                    onClick={() => handleCancel(clinic)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Cancelar</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </DataTable>
                </div>
            </div>
        </AdminLayout>
    );
}
