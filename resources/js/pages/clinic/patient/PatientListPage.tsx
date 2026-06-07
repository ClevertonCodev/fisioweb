import { MoreVertical, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { usePatients } from '@/application/clinic';
import { useClinicProfessionals } from '@/application/clinic/use-clinic-users';
import { useBulkInactivatePatients } from '@/application/clinic/use-patients';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { TableCell, TableRow } from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Patient, PatientStatus } from '@/domain/clinic/patient';

const COLUMNS: DataTableColumn[] = [
    { title: '', key: 'check', className: 'w-10' },
    { title: 'Paciente', key: 'name' },
    { title: 'Criado por', key: 'professional' },
    { title: 'Status', key: 'status' },
    { title: 'Resumo do diagnóstico', key: 'diagnosis' },
    { title: '', key: 'actions', className: 'w-10' },
];

const STATUS_VARIANTS: Record<
    PatientStatus,
    'info' | 'warning' | 'success' | 'neutral' | 'danger'
> = {
    em_tratamento: 'info',
    em_treinamento: 'success',
    em_prevencao: 'warning',
    cancelado: 'neutral',
    obito: 'danger',
    alta: 'success',
};

const STATUS_LABELS: Record<PatientStatus, string> = {
    em_tratamento: 'Em tratamento',
    em_treinamento: 'Em treinamento',
    em_prevencao: 'Em prevenção',
    cancelado: 'Cancelado',
    obito: 'Óbito',
    alta: 'Alta',
};

const STATUS_FILTER_OPTIONS: { value: PatientStatus; label: string }[] = [
    { value: 'em_tratamento', label: 'Em tratamento' },
    { value: 'em_treinamento', label: 'Em treinamento' },
    { value: 'em_prevencao', label: 'Em prevenção' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'obito', label: 'Óbito' },
    { value: 'alta', label: 'Alta' },
];

function firstLetter(name: string): string {
    return name.trim()[0]?.toUpperCase() ?? '?';
}

function PatientListTableSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <Card className="overflow-hidden">
            <div className="grid grid-cols-[40px_1.5fr_1fr_1fr_1.5fr_40px] gap-4 border-b p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-4 w-20" />
                ))}
            </div>
            <div>
                {Array.from({ length: rows }).map((_, row) => (
                    <div
                        key={`row-${row}`}
                        className="grid grid-cols-[40px_1.5fr_1fr_1fr_1.5fr_40px] items-center gap-4 border-b p-4 last:border-b-0"
                    >
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <Skeleton className="h-4 w-40" />
                        </div>
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-7 w-24 rounded-full" />
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default function PatientListPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [perPage, setPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Filter state
    const [statusFilters, setStatusFilters] = useState<PatientStatus[]>([]);
    const [professionalFilters, setProfessionalFilters] = useState<string[]>(
        [],
    );
    const [activeFilter, setActiveFilter] = useState<boolean | undefined>(
        undefined,
    ); // undefined = todos
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 400);
        return () => clearTimeout(timer);
    }, [search]);

    const { data: clinicUsers = [] } = useClinicProfessionals();
    const bulkInactivate = useBulkInactivatePatients();

    const { data, isLoading, isError } = usePatients({
        page: currentPage,
        perPage,
        search: debouncedSearch || undefined,
        isActive: activeFilter,
        statuses: statusFilters.length > 0 ? statusFilters : undefined,
        professionalIds:
            professionalFilters.length > 0 ? professionalFilters : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
    });

    const patients = data?.data ?? [];
    const totalPages = data?.lastPage ?? 1;
    const total = data?.total ?? 0;

    const activeFilterCount =
        statusFilters.length +
        professionalFilters.length +
        (activeFilter !== undefined ? 1 : 0) +
        (dateFrom ? 1 : 0) +
        (dateTo ? 1 : 0);

    const allProfessionalsSelected =
        clinicUsers.length > 0 &&
        professionalFilters.length === clinicUsers.length;

    const emptyMessage = isError
        ? 'Erro ao carregar pacientes. Tente novamente.'
        : 'Nenhum paciente encontrado.';

    const pagination =
        totalPages > 1
            ? { currentPage, totalPages, onPageChange: setCurrentPage }
            : undefined;

    const toggleStatus = useCallback((value: PatientStatus) => {
        setStatusFilters((prev) =>
            prev.includes(value)
                ? prev.filter((v) => v !== value)
                : [...prev, value],
        );
        setCurrentPage(1);
    }, []);

    const toggleProfessional = useCallback((id: string) => {
        setProfessionalFilters((prev) =>
            prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
        );
        setCurrentPage(1);
    }, []);

    const toggleAllProfessionals = useCallback(() => {
        if (allProfessionalsSelected) {
            setProfessionalFilters([]);
        } else {
            setProfessionalFilters(clinicUsers.map((u) => u.id));
        }
        setCurrentPage(1);
    }, [allProfessionalsSelected, clinicUsers]);

    const clearFilters = useCallback(() => {
        setStatusFilters([]);
        setProfessionalFilters([]);
        setActiveFilter(undefined);
        setDateFrom('');
        setDateTo('');
        setSelectedIds([]);
        setCurrentPage(1);
    }, []);

    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                    <div className="px-6 py-6">
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-semibold text-foreground">
                                Pacientes e evoluções
                            </h1>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        className="gap-2"
                                        onClick={() =>
                                            navigate('/clinica/pacientes/novo')
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                        Novo paciente
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Cadastrar novo paciente
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {/* Search + Filters bar */}
                    <div className="mb-6 flex items-center gap-3">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Pesquisar por nome, CPF ou e-mail"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="pl-9"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm whitespace-nowrap text-muted-foreground">
                                De
                            </span>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-36"
                            />
                            <span className="text-sm whitespace-nowrap text-muted-foreground">
                                até
                            </span>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-36"
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
                                            onClick={clearFilters}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-3 w-3" />
                                            Limpar
                                        </button>
                                    )}
                                </div>

                                <Separator />

                                {/* Situação */}
                                <div className="py-1">
                                    <p className="px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Situação
                                    </p>
                                    <label className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-accent">
                                        <Checkbox
                                            checked={activeFilter === true}
                                            onCheckedChange={() => {
                                                setActiveFilter((prev) =>
                                                    prev === true
                                                        ? undefined
                                                        : true,
                                                );
                                                setCurrentPage(1);
                                            }}
                                        />
                                        <span className="text-sm">Ativo</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-accent">
                                        <Checkbox
                                            checked={activeFilter === false}
                                            onCheckedChange={() => {
                                                setActiveFilter((prev) =>
                                                    prev === false
                                                        ? undefined
                                                        : false,
                                                );
                                                setCurrentPage(1);
                                            }}
                                        />
                                        <span className="text-sm">Inativo</span>
                                    </label>
                                </div>

                                <Separator />

                                {/* Status clínico */}
                                <div className="py-1">
                                    <p className="px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                        Status
                                    </p>
                                    {STATUS_FILTER_OPTIONS.map((opt) => (
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

                                {/* Profissional */}
                                {clinicUsers.length > 0 && (
                                    <>
                                        <Separator />
                                        <div className="py-1">
                                            <p className="px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                                Profissional
                                            </p>
                                            <label className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-accent">
                                                <Checkbox
                                                    checked={
                                                        allProfessionalsSelected
                                                    }
                                                    onCheckedChange={
                                                        toggleAllProfessionals
                                                    }
                                                />
                                                <span className="text-sm font-medium">
                                                    Selecionar Todos
                                                </span>
                                            </label>
                                            <Separator className="my-1" />
                                            <ScrollArea className="max-h-52">
                                                {clinicUsers.map((user) => (
                                                    <label
                                                        key={user.id}
                                                        className="flex cursor-pointer items-center gap-3 px-4 py-2 hover:bg-accent"
                                                    >
                                                        <Checkbox
                                                            checked={professionalFilters.includes(
                                                                user.id,
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleProfessional(
                                                                    user.id,
                                                                )
                                                            }
                                                        />
                                                        <Avatar className="h-7 w-7 shrink-0">
                                                            <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                                                {firstLetter(
                                                                    user.name,
                                                                )}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm leading-tight">
                                                            {user.name}
                                                        </span>
                                                    </label>
                                                ))}
                                            </ScrollArea>
                                        </div>
                                    </>
                                )}
                            </PopoverContent>
                        </Popover>

                        {activeFilterCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                                Limpar filtros
                            </button>
                        )}
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="mb-4 flex items-center gap-3">
                            <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                                disabled={bulkInactivate.isPending}
                                onClick={() => {
                                    bulkInactivate.mutate(selectedIds, {
                                        onSuccess: () => setSelectedIds([]),
                                    });
                                }}
                            >
                                Inativar {selectedIds.length}{' '}
                                {selectedIds.length === 1
                                    ? 'paciente'
                                    : 'pacientes'}
                            </Button>
                            <button
                                onClick={() => setSelectedIds([])}
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3 w-3" />
                                Cancelar seleção
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <PatientListTableSkeleton rows={Math.min(perPage, 8)} />
                    ) : (
                        <DataTable<Patient>
                            columns={COLUMNS}
                            data={patients}
                            emptyMessage={emptyMessage}
                            totalLabel="pacientes"
                            totalCount={total}
                            pagination={pagination}
                            pageSize={perPage}
                            pageSizeOptions={[10, 25, 50]}
                            onPageSizeChange={(size) => {
                                setPerPage(size);
                                setCurrentPage(1);
                            }}
                        >
                            {(patient) => (
                                <TableRow
                                    key={patient.id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(
                                            `/clinica/pacientes/${patient.id}`,
                                        )
                                    }
                                >
                                    <TableCell
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Checkbox
                                            checked={selectedIds.includes(
                                                patient.id,
                                            )}
                                            onCheckedChange={(checked) => {
                                                setSelectedIds((prev) =>
                                                    checked
                                                        ? [...prev, patient.id]
                                                        : prev.filter(
                                                              (id) =>
                                                                  id !==
                                                                  patient.id,
                                                          ),
                                                );
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                {patient.photoUrl && (
                                                    <AvatarImage
                                                        src={patient.photoUrl}
                                                        alt={patient.name}
                                                    />
                                                )}
                                                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                                                    {patient.initial}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">
                                                {patient.name}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {patient.professional || '—'}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge
                                            variant={
                                                STATUS_VARIANTS[
                                                    patient.status
                                                ] ?? 'neutral'
                                            }
                                        >
                                            {STATUS_LABELS[patient.status] ??
                                                patient.status}
                                        </StatusBadge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {patient.diagnosis || '—'}
                                    </TableCell>
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
                                                className="w-48"
                                            >
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        navigate(
                                                            `/clinica/pacientes/${patient.id}`,
                                                        )
                                                    }
                                                >
                                                    Editar perfil
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        navigate(
                                                            `/clinica/pacientes/${patient.id}`,
                                                        )
                                                    }
                                                >
                                                    Prontuário
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        navigate(
                                                            `/clinica/pacientes/${patient.id}?tab=programas`,
                                                        )
                                                    }
                                                >
                                                    Programas
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() =>
                                                        navigate(
                                                            `/clinica/pacientes/${patient.id}?tab=monitoramento`,
                                                        )
                                                    }
                                                >
                                                    Monitoramento
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    Agendamentos
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    Pagamentos
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    disabled={
                                                        bulkInactivate.isPending
                                                    }
                                                    onClick={() => {
                                                        bulkInactivate.mutate([
                                                            patient.id,
                                                        ]);
                                                    }}
                                                >
                                                    Inativar paciente
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )}
                        </DataTable>
                    )}
                </div>
            </div>
        </ClinicLayout>
    );
}
