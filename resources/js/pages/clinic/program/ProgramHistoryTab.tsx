import {
    BookmarkCheck,
    Copy,
    FileDown,
    FileText,
    MoreVertical,
    Plus,
    Search,
    SlidersHorizontal,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { downloadProgramPdf } from '@/application/clinic/download-program-pdf';
import { formatProgramClinicalRecordText } from '@/application/clinic/format-program-clinical-record-text';
import { useClinicProfessionals } from '@/application/clinic/use-clinic-users';
import {
    findClinicProgram,
    useClinicPrograms,
    useConvertToModelClinicProgram,
    useDeleteClinicProgram,
    useDuplicateClinicProgram,
} from '@/application/clinic/use-programs';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardList } from '@/components/ui/card-list';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import type { Program } from '@/domain/clinic';

function firstLetter(name: string | null): string {
    if (!name) return '?';
    return name.trim()[0].toUpperCase();
}

function formatDate(iso: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

function dateDiffDays(a: string, b: string): number {
    return Math.round(
        (new Date(b).getTime() - new Date(a).getTime()) / 86_400_000,
    );
}

function validityProgress(program: Program): number {
    if (!program.startDate || !program.endDate) return 0;
    const total = dateDiffDays(program.startDate, program.endDate);
    if (total <= 0) return 100;
    const elapsed = dateDiffDays(
        program.startDate,
        new Date().toISOString().slice(0, 10),
    );
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

type UiStatus = 'not_viewed' | 'viewed' | 'completed' | 'draft';

function deriveUiStatus(program: Program): UiStatus {
    if (program.status === 'draft') return 'draft';
    if (program.status === 'completed') return 'completed';
    if (program.patientViewedAt) return 'viewed';
    return 'not_viewed';
}

const uiStatusConfig: Record<UiStatus, { progressColor: string }> = {
    not_viewed: { progressColor: 'bg-amber-500' },
    viewed: { progressColor: 'bg-primary' },
    completed: { progressColor: 'bg-emerald-500' },
    draft: { progressColor: 'bg-muted-foreground' },
};

function StatusBadge({ program }: { program: Program }) {
    const ui = deriveUiStatus(program);
    if (ui === 'completed') {
        return (
            <Badge
                variant="outline"
                className="shrink-0 border-emerald-200 bg-emerald-50 text-xs whitespace-nowrap text-emerald-600"
            >
                Completou
                {program.patientCompletedCount > 0
                    ? ` • ${program.patientCompletedCount}x`
                    : ''}
            </Badge>
        );
    }
    if (ui === 'not_viewed') {
        return (
            <Badge
                variant="outline"
                className="shrink-0 border-amber-200 bg-amber-50 text-xs whitespace-nowrap text-amber-600"
            >
                Não visualizado
            </Badge>
        );
    }
    if (ui === 'viewed') {
        return (
            <Badge
                variant="outline"
                className="shrink-0 border-border text-xs whitespace-nowrap text-muted-foreground"
            >
                Visualizado
            </Badge>
        );
    }
    return (
        <Badge
            variant="outline"
            className="shrink-0 border-border text-xs whitespace-nowrap text-muted-foreground"
        >
            Rascunho
        </Badge>
    );
}

function ProgressBar({ program }: { program: Program }) {
    const progress = validityProgress(program);
    const ui = deriveUiStatus(program);
    const { progressColor } = uiStatusConfig[ui];
    return (
        <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-muted">
            <div
                className={`h-full rounded-full ${progressColor}`}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

type ProgramActionsProps = {
    program: Program;
    onDuplicate: (id: string) => void;
    onToModel: (id: string) => void;
    onCopyClinicalText: (id: string) => void;
    onDelete: (p: Program) => void;
};

function ProgramActions({
    program,
    onDuplicate,
    onToModel,
    onCopyClinicalText,
    onDelete,
}: ProgramActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => onDuplicate(program.id)}
                    className="cursor-pointer gap-2"
                >
                    <Copy className="h-4 w-4" />
                    Duplicar
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onCopyClinicalText(program.id)}
                    className="cursor-pointer gap-2"
                >
                    <FileText className="h-4 w-4" />
                    Texto para prontuário
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => downloadProgramPdf(program.id)}
                    className="cursor-pointer gap-2"
                >
                    <FileDown className="h-4 w-4" />
                    Baixar PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => onToModel(program.id)}
                    className="cursor-pointer gap-2"
                >
                    <BookmarkCheck className="h-4 w-4" />
                    Transformar em modelo
                </DropdownMenuItem>
                {program.status === 'draft' && (
                    <DropdownMenuItem
                        onClick={() => onDelete(program)}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const COLUMNS: DataTableColumn[] = [
    { title: 'Paciente', key: 'patient' },
    { title: 'Programa de exercícios', key: 'program' },
    { title: 'Profissional', key: 'professional' },
    { title: 'Validade', key: 'validity', className: 'min-w-[10rem]' },
    { title: 'Status', key: 'status' },
    { title: '', key: 'actions', className: 'w-10' },
];

const STATUS_FILTER_OPTIONS: { value: UiStatus; label: string }[] = [
    { value: 'completed', label: 'Programas completos' },
    { value: 'viewed', label: 'Programas visualizados' },
    { value: 'not_viewed', label: 'Programas não visualizados' },
    { value: 'draft', label: 'Programas desativados' },
];

function ProgramHistoryTableSkeleton({ rows = 6 }: { rows?: number }) {
    return (
        <Card className="mt-4 overflow-hidden">
            <div className="grid grid-cols-[1.2fr_1.6fr_1fr_1fr_1fr_40px] gap-4 border-b p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={`header-${i}`} className="h-4 w-24" />
                ))}
            </div>
            <div className="space-y-0">
                {Array.from({ length: rows }).map((_, row) => (
                    <div
                        key={`row-${row}`}
                        className="grid grid-cols-[1.2fr_1.6fr_1fr_1fr_1fr_40px] items-center gap-4 border-b p-4 last:border-b-0"
                    >
                        <Skeleton className="h-9 w-40" />
                        <Skeleton className="h-9 w-52" />
                        <Skeleton className="h-9 w-32" />
                        <Skeleton className="h-9 w-36" />
                        <Skeleton className="h-7 w-24 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                    </div>
                ))}
            </div>
        </Card>
    );
}

function ProgramHistoryCardSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, row) => (
                <Card key={`card-${row}`} className="p-4">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                        </div>
                        <Skeleton className="h-5 w-48" />
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

export default function ProgramHistoryTab() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientIdFilter = searchParams.get('patientId');
    const [searchPrograms, setSearchPrograms] = useState(
        () => searchParams.get('search') ?? '',
    );
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [statusFilters, setStatusFilters] = useState<UiStatus[]>([]);
    const [professionalFilters, setProfessionalFilters] = useState<string[]>(
        [],
    );
    const [filtersOpen, setFiltersOpen] = useState(false);

    const apiStatus = useMemo(() => {
        if (statusFilters.length === 0) return undefined;
        const hasActiveVariant = statusFilters.some(
            (s) => s === 'not_viewed' || s === 'viewed',
        );
        const hasDraft = statusFilters.includes('draft');
        const hasCompleted = statusFilters.includes('completed');
        const backendStatuses = [
            hasActiveVariant ? 'active' : null,
            hasDraft ? 'draft' : null,
            hasCompleted ? 'completed' : null,
        ].filter(Boolean);
        return backendStatuses.length === 1
            ? (backendStatuses[0] as string)
            : undefined;
    }, [statusFilters]);

    const {
        data: result,
        isFetching,
        isLoading,
    } = useClinicPrograms({
        page: currentPage,
        perPage,
        search: searchPrograms || undefined,
        status: apiStatus,
    });
    const [isPaginationLoading, setIsPaginationLoading] = useState(false);
    const showSkeleton = isLoading || isPaginationLoading;

    // Ajuste durante o render: liga o loading ao trocar de página e desliga
    // quando o fetch termina.
    const [lastPage, setLastPage] = useState(currentPage);
    if (lastPage !== currentPage) {
        setLastPage(currentPage);
        setIsPaginationLoading(true);
    } else if (!isFetching && isPaginationLoading) {
        setIsPaginationLoading(false);
    }

    const { data: clinicUsers = [] } = useClinicProfessionals();

    const visiblePrograms = useMemo(() => {
        let items = result?.items ?? [];
        if (patientIdFilter) {
            items = items.filter((p) => p.patientId === patientIdFilter);
        }
        if (statusFilters.length > 0) {
            items = items.filter((p) =>
                statusFilters.includes(deriveUiStatus(p)),
            );
        }
        if (professionalFilters.length > 0) {
            items = items.filter(
                (p) =>
                    p.professionalId !== null &&
                    professionalFilters.includes(p.professionalId),
            );
        }
        return items;
    }, [result, statusFilters, professionalFilters, patientIdFilter]);

    const totalCount = result?.total ?? 0;
    const totalPages = result?.lastPage ?? 1;

    const activeFilterCount = statusFilters.length + professionalFilters.length;
    const allProfessionalsSelected =
        clinicUsers.length > 0 &&
        professionalFilters.length === clinicUsers.length;

    const toggleStatus = useCallback((value: UiStatus) => {
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
        setCurrentPage(1);
    }, []);

    const { mutate: duplicate } = useDuplicateClinicProgram();
    const { mutate: toModel } = useConvertToModelClinicProgram();
    const { mutate: deleteProgram } = useDeleteClinicProgram();
    const [programToDelete, setProgramToDelete] = useState<Program | null>(
        null,
    );

    const copyClinicalText = useCallback(async (programId: string) => {
        try {
            const full = await findClinicProgram(programId);
            if (!full) {
                toast.error('Não foi possível carregar o programa.');
                return;
            }
            const text = formatProgramClinicalRecordText(full);
            if (!text) {
                toast.error('Programa sem exercícios para copiar.');
                return;
            }
            await navigator.clipboard.writeText(text);
            toast.success('Texto copiado para a área de transferência.');
        } catch {
            toast.error('Não foi possível copiar o texto.');
        }
    }, []);

    return (
        <>
            <div className="p-6">
                {/* Filters bar */}
                <div className="mb-6 flex items-center gap-4">
                    <div className="relative w-64">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Pesquisar"
                            value={searchPrograms}
                            onChange={(e) => {
                                setSearchPrograms(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-9"
                        />
                    </div>
                    <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
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

                {/* Tabela — desktop */}
                <div className="hidden md:block">
                    {showSkeleton ? (
                        <ProgramHistoryTableSkeleton
                            rows={Math.min(perPage, 8)}
                        />
                    ) : (
                        <DataTable<Program>
                            columns={COLUMNS}
                            data={visiblePrograms}
                            totalCount={totalCount}
                            totalLabel="programas"
                            emptyMessage={
                                searchPrograms || activeFilterCount > 0
                                    ? 'Nenhum programa encontrado para os filtros aplicados.'
                                    : 'Nenhum programa criado.'
                            }
                            pagination={
                                totalPages > 1
                                    ? {
                                          currentPage,
                                          totalPages,
                                          onPageChange: setCurrentPage,
                                      }
                                    : undefined
                            }
                            pageSize={perPage}
                            pageSizeOptions={[10, 25, 50]}
                            onPageSizeChange={(size) => {
                                setPerPage(size);
                                setCurrentPage(1);
                            }}
                        >
                            {(program) => (
                                <TableRow
                                    key={program.id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                        navigate(
                                            `/clinica/programas/${program.id}`,
                                        )
                                    }
                                >
                                    {/* Paciente */}
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                {program.patientPhotoUrl && (
                                                    <AvatarImage
                                                        src={
                                                            program.patientPhotoUrl
                                                        }
                                                        alt={
                                                            program.patientName ??
                                                            ''
                                                        }
                                                    />
                                                )}
                                                <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                                    {firstLetter(
                                                        program.patientName,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium text-foreground">
                                                {program.patientName ??
                                                    '(sem paciente)'}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Programa */}
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-foreground">
                                                {program.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {program.exerciseCount}{' '}
                                                {program.exerciseCount === 1
                                                    ? 'exercício'
                                                    : 'exercícios'}
                                            </p>
                                        </div>
                                    </TableCell>

                                    {/* Profissional */}
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar
                                                key={
                                                    program.professionalPhotoUrl ??
                                                    'no-photo'
                                                }
                                                className="h-7 w-7"
                                            >
                                                {program.professionalPhotoUrl && (
                                                    <AvatarImage
                                                        src={
                                                            program.professionalPhotoUrl
                                                        }
                                                        alt={
                                                            program.professionalName ??
                                                            ''
                                                        }
                                                    />
                                                )}
                                                <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                                    {firstLetter(
                                                        program.professionalName,
                                                    )}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-muted-foreground">
                                                {program.professionalName ??
                                                    '—'}
                                            </span>
                                        </div>
                                    </TableCell>

                                    {/* Validade */}
                                    <TableCell>
                                        <div className="min-w-[10rem]">
                                            <p className="text-sm whitespace-nowrap text-foreground">
                                                {formatDate(program.endDate)}{' '}
                                                {program.startDate &&
                                                    program.endDate && (
                                                        <span className="text-muted-foreground">
                                                            (
                                                            {dateDiffDays(
                                                                program.startDate,
                                                                program.endDate,
                                                            )}{' '}
                                                            dias)
                                                        </span>
                                                    )}
                                            </p>
                                            {program.startDate &&
                                                program.endDate && (
                                                    <ProgressBar
                                                        program={program}
                                                    />
                                                )}
                                        </div>
                                    </TableCell>

                                    {/* Status */}
                                    <TableCell>
                                        <StatusBadge program={program} />
                                    </TableCell>

                                    {/* Ações */}
                                    <TableCell
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <ProgramActions
                                            program={program}
                                            onDuplicate={duplicate}
                                            onToModel={toModel}
                                            onCopyClinicalText={
                                                copyClinicalText
                                            }
                                            onDelete={setProgramToDelete}
                                        />
                                    </TableCell>
                                </TableRow>
                            )}
                        </DataTable>
                    )}
                </div>

                {/* Cards — mobile */}
                <div className="md:hidden">
                    {showSkeleton ? (
                        <ProgramHistoryCardSkeleton
                            rows={Math.min(perPage, 4)}
                        />
                    ) : (
                        <CardList<Program>
                            data={visiblePrograms}
                            totalCount={totalCount}
                            totalLabel="programas"
                            emptyMessage={
                                searchPrograms || activeFilterCount > 0
                                    ? 'Nenhum programa encontrado para os filtros aplicados.'
                                    : 'Nenhum programa criado.'
                            }
                            pagination={
                                totalPages > 1
                                    ? {
                                          currentPage,
                                          totalPages,
                                          onPageChange: setCurrentPage,
                                      }
                                    : undefined
                            }
                            pageSize={perPage}
                            pageSizeOptions={[10, 25, 50]}
                            onPageSizeChange={(size) => {
                                setPerPage(size);
                                setCurrentPage(1);
                            }}
                        >
                            {(program) => (
                                <Card
                                    key={program.id}
                                    className="cursor-pointer transition-colors hover:bg-accent/40"
                                    onClick={() =>
                                        navigate(
                                            `/clinica/programas/${program.id}`,
                                        )
                                    }
                                >
                                    <div className="p-4">
                                        {/* Linha 1: paciente + status + ações */}
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <Avatar className="h-9 w-9 shrink-0">
                                                    {program.patientPhotoUrl && (
                                                        <AvatarImage
                                                            src={
                                                                program.patientPhotoUrl
                                                            }
                                                            alt={
                                                                program.patientName ??
                                                                ''
                                                            }
                                                        />
                                                    )}
                                                    <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                                        {firstLetter(
                                                            program.patientName,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="truncate font-medium text-foreground">
                                                    {program.patientName ??
                                                        '(sem paciente)'}
                                                </span>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-1">
                                                <StatusBadge
                                                    program={program}
                                                />
                                                <div
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }
                                                >
                                                    <ProgramActions
                                                        program={program}
                                                        onDuplicate={duplicate}
                                                        onToModel={toModel}
                                                        onCopyClinicalText={
                                                            copyClinicalText
                                                        }
                                                        onDelete={
                                                            setProgramToDelete
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Linha 2: título + exercícios */}
                                        <div className="mt-2 ml-12">
                                            <p className="font-medium text-foreground">
                                                {program.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {program.exerciseCount}{' '}
                                                {program.exerciseCount === 1
                                                    ? 'exercício'
                                                    : 'exercícios'}
                                            </p>
                                        </div>

                                        {/* Linha 3: profissional + validade */}
                                        <div className="mt-2 ml-12 flex flex-wrap items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <Avatar
                                                    key={
                                                        program.professionalPhotoUrl ??
                                                        'no-photo'
                                                    }
                                                    className="h-6 w-6 shrink-0"
                                                >
                                                    {program.professionalPhotoUrl && (
                                                        <AvatarImage
                                                            src={
                                                                program.professionalPhotoUrl
                                                            }
                                                            alt={
                                                                program.professionalName ??
                                                                ''
                                                            }
                                                        />
                                                    )}
                                                    <AvatarFallback className="bg-muted text-xs text-muted-foreground">
                                                        {firstLetter(
                                                            program.professionalName,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm text-muted-foreground">
                                                    {program.professionalName ??
                                                        '—'}
                                                </span>
                                            </div>
                                            {program.endDate && (
                                                <div className="text-right">
                                                    <p className="text-sm whitespace-nowrap text-foreground">
                                                        {formatDate(
                                                            program.endDate,
                                                        )}{' '}
                                                        {program.startDate &&
                                                            program.endDate && (
                                                                <span className="text-muted-foreground">
                                                                    (
                                                                    {dateDiffDays(
                                                                        program.startDate,
                                                                        program.endDate,
                                                                    )}{' '}
                                                                    dias)
                                                                </span>
                                                            )}
                                                    </p>
                                                    {program.startDate &&
                                                        program.endDate && (
                                                            <div className="flex justify-end">
                                                                <ProgressBar
                                                                    program={
                                                                        program
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </CardList>
                    )}
                </div>

                {totalCount === 0 &&
                    !searchPrograms &&
                    activeFilterCount === 0 &&
                    !showSkeleton && (
                        <div className="mt-6 flex justify-center">
                            <Button
                                onClick={() =>
                                    navigate('/clinica/programas/novo')
                                }
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Criar primeiro programa
                            </Button>
                        </div>
                    )}
            </div>

            <AlertDialog
                open={!!programToDelete}
                onOpenChange={(open) => !open && setProgramToDelete(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir programa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir{' '}
                            <strong>"{programToDelete?.title}"</strong>? Esta
                            ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (programToDelete)
                                    deleteProgram(programToDelete.id);
                                setProgramToDelete(null);
                            }}
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
