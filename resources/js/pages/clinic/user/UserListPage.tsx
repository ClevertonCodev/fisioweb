import {
    MoreVertical,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { can } from '@/application/clinic/permissions';
import {
    useClinicUsers,
    useDeleteClinicUser,
} from '@/application/clinic/use-clinic-users';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import type { ClinicRole } from '@/domain/auth/session';
import type { ClinicUserSummary } from '@/domain/clinic/clinic-user';

const ROLE_LABELS: Record<ClinicRole, string> = {
    admin: 'Administrador',
    secretary: 'Secretário(a)',
    physiotherapist: 'Fisioterapeuta',
};

const ROLE_BADGE_VARIANT: Record<ClinicRole, 'success' | 'info' | 'warning'> = {
    admin: 'success',
    physiotherapist: 'info',
    secretary: 'warning',
};

const ROLE_FILTER_OPTIONS: { value: ClinicRole; label: string }[] = [
    { value: 'admin', label: 'Administrador' },
    { value: 'secretary', label: 'Secretário(a)' },
    { value: 'physiotherapist', label: 'Fisioterapeuta' },
];

const BASE_COLUMNS: DataTableColumn[] = [
    { title: 'Usuário', key: 'name' },
    { title: 'E-mail', key: 'email' },
    { title: 'Função', key: 'role' },
    { title: 'Mestre', key: 'mestre' },
    { title: 'Status', key: 'status' },
];

function firstLetter(name: string): string {
    return name.trim()[0]?.toUpperCase() ?? '?';
}

function UserTableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <Card className="mt-4 overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1.4fr_1fr_0.8fr_0.8fr_40px] gap-4 border-b p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-4 w-24" />
                ))}
            </div>
            <div className="space-y-0">
                {Array.from({ length: rows }).map((_, row) => (
                    <div
                        key={`row-${row}`}
                        className="grid grid-cols-[1.2fr_1.4fr_1fr_0.8fr_0.8fr_40px] items-center gap-4 border-b p-4 last:border-b-0"
                    >
                        <Skeleton className="h-9 w-40" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-6 w-28 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                ))}
            </div>
        </Card>
    );
}

export function UserListPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const role = user?.role as ClinicRole | undefined;

    const { data: users = [], isLoading, isError } = useClinicUsers();
    const deleteUser = useDeleteClinicUser();

    const [search, setSearch] = useState('');
    const [roleFilters, setRoleFilters] = useState<ClinicRole[]>([]);
    const [statusFilters, setStatusFilters] = useState<
        Array<'active' | 'inactive'>
    >([]);
    const [masterFilters, setMasterFilters] = useState<Array<'yes' | 'no'>>([]);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [targetDelete, setTargetDelete] = useState<ClinicUserSummary | null>(
        null,
    );

    const activeFilterCount =
        roleFilters.length + statusFilters.length + masterFilters.length;

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return users.filter((u) => {
            if (q) {
                const name = u.name.toLowerCase();
                const mail = u.email.toLowerCase();
                if (!name.includes(q) && !mail.includes(q)) return false;
            }
            if (roleFilters.length > 0 && !roleFilters.includes(u.role))
                return false;
            const isActive = Boolean(u.status);
            if (statusFilters.length > 0) {
                const matchesActive =
                    statusFilters.includes('active') && isActive;
                const matchesInactive =
                    statusFilters.includes('inactive') && !isActive;
                if (!matchesActive && !matchesInactive) return false;
            }
            if (masterFilters.length > 0) {
                const isMaster = u.mestre === 1;
                const matchesYes = masterFilters.includes('yes') && isMaster;
                const matchesNo = masterFilters.includes('no') && !isMaster;
                if (!matchesYes && !matchesNo) return false;
            }
            return true;
        });
    }, [users, search, roleFilters, statusFilters, masterFilters]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

    useEffect(() => {
        setPage(1);
    }, [search, roleFilters, statusFilters, masterFilters]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const paginated = useMemo(() => {
        const start = (page - 1) * perPage;
        return filtered.slice(start, start + perPage);
    }, [filtered, page, perPage]);

    const pagination =
        totalPages > 1
            ? { currentPage: page, totalPages, onPageChange: setPage }
            : undefined;

    const filtersActive = !!search.trim() || activeFilterCount > 0;

    const emptyMessage = isLoading
        ? 'Carregando usuários...'
        : isError
          ? 'Erro ao carregar usuários. Tente novamente.'
          : users.length === 0
            ? 'Nenhum usuário encontrado.'
            : filtersActive
              ? 'Nenhum usuário corresponde aos filtros aplicados.'
              : 'Nenhum usuário encontrado.';

    const toggleRole = useCallback((value: ClinicRole) => {
        setRoleFilters((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value],
        );
    }, []);

    const toggleStatus = useCallback((value: 'active' | 'inactive') => {
        setStatusFilters((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value],
        );
    }, []);

    const toggleMaster = useCallback((value: 'yes' | 'no') => {
        setMasterFilters((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value],
        );
    }, []);

    const clearFilters = useCallback(() => {
        setRoleFilters([]);
        setStatusFilters([]);
        setMasterFilters([]);
        setPage(1);
    }, []);

    const showActions = can.manageUsers(role);
    const canDeleteUsers = can.delete(role);

    const columns = useMemo(() => {
        const cols = [...BASE_COLUMNS];
        if (showActions) {
            cols.push({ title: '', key: 'actions', className: 'w-10' });
        }
        return cols;
    }, [showActions]);

    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="px-6 py-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-foreground">
                                Usuários
                            </h1>
                            {showActions && (
                                <Button
                                    className="gap-2"
                                    onClick={() =>
                                        navigate('/clinica/usuarios/novo')
                                    }
                                >
                                    <Plus className="h-4 w-4" />
                                    Novo usuário
                                </Button>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-6">
                    <div className="mb-6 flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                                autoComplete="off"
                            />
                        </div>

                        <Popover
                            open={filtersOpen}
                            onOpenChange={setFiltersOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <SlidersHorizontal className="h-4 w-4" />
                                    Filtros
                                    {activeFilterCount > 0 && (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-64 p-0">
                                <div className="flex items-center justify-between px-4 py-3">
                                    <span className="text-sm font-semibold">
                                        Filtros
                                    </span>
                                    {activeFilterCount > 0 && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                            Limpar
                                        </button>
                                    )}
                                </div>
                                <Separator />
                                <div className="py-1">
                                    <p className="px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Função
                                    </p>
                                    {ROLE_FILTER_OPTIONS.map((opt) => (
                                        <label
                                            key={opt.value}
                                            className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-accent"
                                        >
                                            <Checkbox
                                                checked={roleFilters.includes(
                                                    opt.value,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleRole(opt.value)
                                                }
                                            />
                                            <span className="text-sm">
                                                {opt.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <Separator />
                                <div className="py-1">
                                    <p className="px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Status
                                    </p>
                                    {[
                                        {
                                            value: 'active' as const,
                                            label: 'Ativo',
                                        },
                                        {
                                            value: 'inactive' as const,
                                            label: 'Inativo',
                                        },
                                    ].map((opt) => (
                                        <label
                                            key={opt.value}
                                            className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-accent"
                                        >
                                            <Checkbox
                                                checked={statusFilters.includes(
                                                    opt.value,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleStatus(opt.value)
                                                }
                                            />
                                            <span className="text-sm">
                                                {opt.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                                <Separator />
                                <div className="py-1">
                                    <p className="px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Mestre
                                    </p>
                                    {[
                                        { value: 'yes' as const, label: 'Sim' },
                                        { value: 'no' as const, label: 'Não' },
                                    ].map((opt) => (
                                        <label
                                            key={opt.value}
                                            className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-accent"
                                        >
                                            <Checkbox
                                                checked={masterFilters.includes(
                                                    opt.value,
                                                )}
                                                onCheckedChange={() =>
                                                    toggleMaster(opt.value)
                                                }
                                            />
                                            <span className="text-sm">
                                                {opt.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {activeFilterCount > 0 && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                                Limpar filtros
                            </button>
                        )}
                    </div>

                    {isLoading ? (
                        <UserTableSkeleton rows={Math.min(perPage, 6)} />
                    ) : (
                        <DataTable<ClinicUserSummary>
                            columns={columns}
                            data={isError ? [] : paginated}
                            emptyMessage={emptyMessage}
                            totalLabel="usuários"
                            totalCount={filtered.length}
                            pagination={pagination}
                            pageSize={perPage}
                            pageSizeOptions={[10, 25, 50]}
                            onPageSizeChange={(size) => {
                                setPerPage(size);
                                setPage(1);
                            }}
                        >
                            {(u) => (
                                <TableRow
                                    key={u.id}
                                    className={
                                        showActions
                                            ? 'cursor-pointer'
                                            : undefined
                                    }
                                    onClick={
                                        showActions
                                            ? () =>
                                                  navigate(
                                                      `/clinica/usuarios/${u.id}/editar`,
                                                  )
                                            : undefined
                                    }
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                key={u.photoUrl ?? 'no-photo'}
                                                className="h-9 w-9"
                                            >
                                                {u.photoUrl && (
                                                    <AvatarImage
                                                        src={u.photoUrl}
                                                        alt=""
                                                        className="object-cover"
                                                    />
                                                )}
                                                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                                    {firstLetter(u.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">
                                                {u.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {u.email}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            variant={
                                                ROLE_BADGE_VARIANT[u.role] ??
                                                'neutral'
                                            }
                                            className="shrink-0 whitespace-nowrap"
                                        >
                                            {ROLE_LABELS[u.role] ?? u.role}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            variant={
                                                u.mestre === 1
                                                    ? 'success'
                                                    : 'danger'
                                            }
                                            className="shrink-0 whitespace-nowrap"
                                        >
                                            {u.mestre === 1 ? 'Sim' : 'Não'}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            variant={
                                                u.status ? 'success' : 'danger'
                                            }
                                            className="shrink-0 whitespace-nowrap"
                                        >
                                            {u.status ? 'Ativo' : 'Inativo'}
                                        </StatusBadge>
                                    </TableCell>
                                    {showActions && (
                                        <TableCell
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-44"
                                                >
                                                    <DropdownMenuItem
                                                        className="cursor-pointer"
                                                        onClick={() =>
                                                            navigate(
                                                                `/clinica/usuarios/${u.id}/editar`,
                                                            )
                                                        }
                                                    >
                                                        Editar usuário
                                                    </DropdownMenuItem>
                                                    {canDeleteUsers &&
                                                        u.mestre !== 1 && (
                                                            <DropdownMenuItem
                                                                className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                                                onClick={() =>
                                                                    setTargetDelete(
                                                                        u,
                                                                    )
                                                                }
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            )}
                        </DataTable>
                    )}
                </div>
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
                            <strong>{targetDelete?.name}</strong>? Esta ação não
                            pode ser desfeita.
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
