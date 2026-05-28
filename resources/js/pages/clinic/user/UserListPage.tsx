import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import { useClinicUsers, useDeleteClinicUser } from '@/application/clinic/use-clinic-users';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

const ROLE_LABELS: Record<ClinicRole, string> = {
    admin: 'Administrador',
    secretary: 'Secretário(a)',
    physiotherapist: 'Fisioterapeuta',
};

const BASE_COLUMNS: DataTableColumn[] = [
    { title: 'Nome', key: 'name' },
    { title: 'E-mail', key: 'email' },
    { title: 'Função', key: 'role' },
    { title: 'Status', key: 'status' },
];

export function UserListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const role = user?.role as ClinicRole | undefined;

    const { data: users = [], isLoading, isError } = useClinicUsers();
    const deleteUser = useDeleteClinicUser();
    const [targetDelete, setTargetDelete] = useState<ClinicUserSummary | null>(null);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | ClinicRole>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const columns = useMemo<DataTableColumn[]>(() => {
        const cols = [...BASE_COLUMNS];
        if (can.manageUsers(role)) {
            cols.push({ title: '', key: 'actions', className: 'w-[1%] text-right whitespace-nowrap' });
        }
        return cols;
    }, [role]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            if (q) {
                const name = u.name.toLowerCase();
                const mail = u.email.toLowerCase();
                if (!name.includes(q) && !mail.includes(q)) return false;
            }
            if (roleFilter !== 'all' && u.role !== roleFilter) return false;
            const active = Boolean(u.status);
            if (statusFilter === 'active' && !active) return false;
            if (statusFilter === 'inactive' && active) return false;
            return true;
        });
    }, [users, search, roleFilter, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

    useEffect(() => {
        setPage(1);
    }, [search, roleFilter, statusFilter]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const paginated = useMemo(() => {
        const start = (page - 1) * perPage;
        return filtered.slice(start, start + perPage);
    }, [filtered, page, perPage]);

    const filtersActive = !!search.trim() || roleFilter !== 'all' || statusFilter !== 'all';
    const showActionsCol = can.manageUsers(role);

    const tableSkeleton = (
        <div role="status" aria-live="polite" className="space-y-3">
            <span className="sr-only">Carregando usuários</span>
            <div className="flex flex-wrap gap-4">
                <Skeleton className="h-10 min-w-[160px] flex-1 basis-52" />
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-10 w-36" />
            </div>
            <Card className="mt-4 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {columns.map((col, i) => (
                                <TableHead key={col.key ?? i}>{col.title || '\u00a0'}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell colSpan={columns.length}>
                                    <Skeleton className="h-8 w-full" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );

    const emptyFilteredMessage =
        users.length > 0 && filtered.length === 0
            ? `Nenhum usuário corresponde aos filtros.${filtersActive ? ' Ajuste a busca ou os filtros.' : ''}`
            : 'Nenhum item encontrado';

    return (
        <ClinicLayout>
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Usuários</h1>
                    {can.manageUsers(role) && (
                        <Button onClick={() => navigate('/clinica/usuarios/novo')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo usuário
                        </Button>
                    )}
                </div>

                {isLoading && tableSkeleton}

                {isError && (
                    <p className="text-destructive text-sm" role="alert">
                        Erro ao carregar usuários.
                    </p>
                )}

                {!isLoading && !isError && (
                    <>
                        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
                            <div className="relative min-w-[200px] flex-1 basis-52">
                                <Label htmlFor="user-search" className="sr-only">
                                    Buscar por nome ou e-mail
                                </Label>
                                <Search className="text-muted-foreground pointer-events-none absolute top-2.5 left-3 h-4 w-4" />
                                <Input
                                    id="user-search"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Buscar nome ou e-mail…"
                                    className="pl-9"
                                    autoComplete="off"
                                />
                            </div>
                            <div className="flex min-w-[180px] flex-col gap-1.5">
                                <Label htmlFor="role-filter">Função</Label>
                                <Select
                                    value={roleFilter}
                                    onValueChange={(v: 'all' | ClinicRole) => setRoleFilter(v)}
                                >
                                    <SelectTrigger id="role-filter">
                                        <SelectValue placeholder="Filtrar função" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas</SelectItem>
                                        <SelectItem value="admin">Administrador</SelectItem>
                                        <SelectItem value="secretary">Secretário(a)</SelectItem>
                                        <SelectItem value="physiotherapist">Fisioterapeuta</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex min-w-[160px] flex-col gap-1.5">
                                <Label htmlFor="status-filter">Status</Label>
                                <Select
                                    value={statusFilter}
                                    onValueChange={(v: 'all' | 'active' | 'inactive') =>
                                        setStatusFilter(v)
                                    }
                                >
                                    <SelectTrigger id="status-filter">
                                        <SelectValue placeholder="Filtrar status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="active">Ativo</SelectItem>
                                        <SelectItem value="inactive">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {users.length === 0 && (
                            <p className="text-muted-foreground text-sm">Nenhum usuário encontrado.</p>
                        )}

                        {users.length > 0 && filtered.length === 0 && (
                            <p className="text-muted-foreground text-sm">{emptyFilteredMessage}</p>
                        )}

                        {filtered.length > 0 && (
                            <DataTable<ClinicUserSummary>
                                columns={columns}
                                data={paginated}
                                emptyMessage={emptyFilteredMessage}
                                totalLabel="usuários"
                                totalCount={filtered.length}
                                pagination={{
                                    currentPage: page,
                                    totalPages,
                                    onPageChange: setPage,
                                }}
                                pageSize={perPage}
                                pageSizeOptions={[5, 10, 25, 50]}
                                onPageSizeChange={(size) => {
                                    setPerPage(size);
                                    setPage(1);
                                }}
                            >
                                {(u) => (
                                    <TableRow key={u.id}>
                                        <TableCell className="font-medium">{u.name}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>{ROLE_LABELS[u.role] ?? u.role}</TableCell>
                                        <TableCell>
                                            <StatusBadge
                                                variant={u.status ? 'active' : 'neutral'}
                                            >
                                                {u.status ? 'Ativo' : 'Inativo'}
                                            </StatusBadge>
                                        </TableCell>
                                        {showActionsCol && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label={`Editar usuário ${u.name}`}
                                                        onClick={() =>
                                                            navigate(
                                                                `/clinica/usuarios/${u.id}/editar`,
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {can.delete(role) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`Excluir usuário ${u.name}`}
                                                            onClick={() => setTargetDelete(u)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )}
                            </DataTable>
                        )}
                    </>
                )}
            </div>

            <AlertDialog
                open={!!targetDelete}
                onOpenChange={(open) => !open && setTargetDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover usuário</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover{' '}
                            <strong>{targetDelete?.name}</strong>? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (targetDelete) {
                                    deleteUser.mutate(targetDelete.id, {
                                        onSettled: () => setTargetDelete(null),
                                    });
                                }
                            }}
                        >
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ClinicLayout>
    );
}
