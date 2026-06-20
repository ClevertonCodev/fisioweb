import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { useFinanceCategories } from '@/application/clinic/use-finance-categories';
import {
    useCreateFinanceTransaction,
    useDeleteFinanceTransaction,
    useFinanceSummary,
    useFinanceTransactions,
    useUpdateFinanceTransaction,
} from '@/application/clinic/use-finance-transactions';
import {
    formatFinanceMoney,
    useFinanceValuesVisibility,
} from '@/application/clinic/use-finance-values-visibility';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { FinanceExportDialog } from '@/components/clinic/finances/FinanceExportDialog';
import { FinanceFiltersDrawer } from '@/components/clinic/finances/FinanceFiltersDrawer';
import {
    currentFinancePeriod,
    FinancePeriodSelector,
} from '@/components/clinic/finances/FinancePeriodSelector';
import { FinanceReportPanel } from '@/components/clinic/finances/FinanceReportPanel';
import { FinanceSearchInput } from '@/components/clinic/finances/FinanceSearchInput';
import { FinanceSettingsPanel } from '@/components/clinic/finances/FinanceSettingsPanel';
import { FinanceSummaryCards } from '@/components/clinic/finances/FinanceSummaryCards';
import { FinanceToggleHidden } from '@/components/clinic/finances/FinanceToggleHidden';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
import { TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    DEFAULT_FINANCE_FILTERS,
    type FinanceFilters,
    type FinanceTransactionWriteDto,
    type FinancialTransaction,
    type FinancialTransactionStatus,
    type FinancialTransactionType,
    type PaymentMethod,
    PAYMENT_METHOD_LABELS,
    STATUS_LABELS,
} from '@/domain/clinic/finance';

const emptyForm = (): FinanceTransactionWriteDto => ({
    date: new Date().toISOString().slice(0, 10),
    description: '',
    categoryId: '',
    type: 'entrada',
    status: 'recebido',
    paymentMethod: 'pix',
    grossAmount: 0,
    feeAmount: 0,
    notes: '',
});

export default function FinancesPage() {
    const [period, setPeriod] = useState(currentFinancePeriod());
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState<10 | 25 | 50>(25);
    const [filters, setFilters] = useState<FinanceFilters>(
        DEFAULT_FINANCE_FILTERS,
    );
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<FinancialTransaction | null>(null);
    const [form, setForm] = useState<FinanceTransactionWriteDto>(emptyForm());
    const { hidden, toggle } = useFinanceValuesVisibility();

    const listParams = useMemo(
        () => ({
            period,
            page,
            perPage,
            filterPreset: filters.filterPreset,
            categoryId: filters.categoryId,
            paymentMethod: filters.paymentMethod,
            q: filters.q || undefined,
        }),
        [period, page, perPage, filters],
    );

    const {
        data: transactions,
        isLoading: listLoading,
        isError: listError,
    } = useFinanceTransactions(listParams);
    const { data: summary, isLoading: summaryLoading } =
        useFinanceSummary(listParams);
    const { data: categories } = useFinanceCategories(form.type);
    const createMutation = useCreateFinanceTransaction();
    const updateMutation = useUpdateFinanceTransaction();
    const deleteMutation = useDeleteFinanceTransaction();

    const applyFilters = (next: FinanceFilters) => {
        setFilters(next);
        setPage(1);
    };

    const openNew = () => {
        setEditing(null);
        setForm(emptyForm());
        setDialogOpen(true);
    };

    const openEdit = (tx: FinancialTransaction) => {
        setEditing(tx);
        setForm({
            date: tx.date.slice(0, 10),
            description: tx.description,
            categoryId: tx.category.id,
            type: tx.type,
            status: tx.status,
            paymentMethod: tx.paymentMethod,
            grossAmount: tx.grossAmount,
            feeAmount: tx.feeAmount,
            notes: tx.notes ?? '',
        });
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!form.categoryId || form.grossAmount <= 0) {
            toast.error('Preencha categoria e valor válido.');
            return;
        }
        if (editing) {
            await updateMutation.mutateAsync({ id: editing.id, dto: form });
        } else {
            await createMutation.mutateAsync(form);
        }
        setDialogOpen(false);
    };

    const columns: DataTableColumn[] = [
        { key: 'date', title: 'Data' },
        { key: 'description', title: 'Descrição' },
        { key: 'category', title: 'Categoria' },
        { key: 'type', title: 'Tipo' },
        { key: 'grossAmount', title: 'Valor' },
        { key: 'status', title: 'Status' },
        { key: 'actions', title: '' },
    ];

    const total = transactions?.meta.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / perPage));

    return (
        <ClinicLayout>
            <div className="flex min-h-0 flex-1 flex-col gap-6 p-6 lg:flex-row">
                <aside className="w-full shrink-0 space-y-4 lg:w-72">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">Finanças</h1>
                        <FinanceToggleHidden hidden={hidden} onToggle={toggle} />
                    </div>

                    <FinancePeriodSelector
                        period={period}
                        onChange={(p) => {
                            setPeriod(p);
                            setPage(1);
                        }}
                    />

                    {summaryLoading ? (
                        <Skeleton className="h-48 w-full rounded-xl" />
                    ) : (
                        <FinanceSummaryCards
                            period={period}
                            summary={summary}
                            hidden={hidden}
                        />
                    )}

                    <Button
                        variant="outline"
                        className="w-full cursor-pointer"
                        asChild
                    >
                        <Link to="/clinica/financas/lixeira">Ver lixeira</Link>
                    </Button>
                </aside>

                <main className="min-w-0 flex-1 space-y-4">
                    <Tabs defaultValue="financas">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <TabsList>
                                <TabsTrigger value="financas">
                                    Finanças
                                </TabsTrigger>
                                <TabsTrigger value="relatorio">
                                    Relatório
                                </TabsTrigger>
                                <TabsTrigger value="configuracoes">
                                    Configurações
                                </TabsTrigger>
                            </TabsList>
                            <div className="flex flex-wrap gap-2">
                                <FinanceExportDialog />
                                <Button
                                    className="cursor-pointer"
                                    onClick={openNew}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Adicionar
                                </Button>
                            </div>
                        </div>

                        <TabsContent value="financas" className="mt-4 space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <FinanceSearchInput
                                    value={filters.q}
                                    onChange={(q) =>
                                        applyFilters({ ...filters, q })
                                    }
                                />
                                <FinanceFiltersDrawer
                                    filters={filters}
                                    onApply={applyFilters}
                                />
                            </div>

                            {listError ? (
                                <p className="text-muted-foreground py-8 text-center text-sm">
                                    Não foi possível carregar as transações.
                                </p>
                            ) : listLoading ? (
                                <Skeleton className="h-64 w-full" />
                            ) : (
                                <DataTable<FinancialTransaction>
                                    columns={columns}
                                    data={transactions?.data ?? []}
                                    emptyMessage="Nenhuma transação nesse período"
                                    totalCount={total}
                                    pageSize={perPage}
                                    onPageSizeChange={(v) => {
                                        setPerPage(v as 10 | 25 | 50);
                                        setPage(1);
                                    }}
                                    pageSizeOptions={[10, 25, 50]}
                                    pagination={{
                                        currentPage: page,
                                        totalPages,
                                        onPageChange: setPage,
                                    }}
                                >
                                    {(row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                {new Date(
                                                    row.date,
                                                ).toLocaleDateString('pt-BR')}
                                            </TableCell>
                                            <TableCell>
                                                {row.description}
                                            </TableCell>
                                            <TableCell>
                                                {row.category.name}
                                            </TableCell>
                                            <TableCell
                                                className={
                                                    row.type === 'entrada'
                                                        ? 'text-emerald-600'
                                                        : 'text-destructive'
                                                }
                                            >
                                                {row.type === 'entrada'
                                                    ? 'Entrada'
                                                    : 'Saída'}
                                            </TableCell>
                                            <TableCell>
                                                {formatFinanceMoney(
                                                    row.grossAmount,
                                                    hidden,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={
                                                        row.status ===
                                                        'recebido'
                                                            ? 'text-emerald-600'
                                                            : row.status ===
                                                                'pendente'
                                                              ? 'text-amber-600'
                                                              : 'text-blue-600'
                                                    }
                                                >
                                                    {STATUS_LABELS[row.status]}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="cursor-pointer"
                                                        onClick={() =>
                                                            openEdit(row)
                                                        }
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="cursor-pointer text-destructive"
                                                        onClick={() =>
                                                            deleteMutation.mutate(
                                                                row.id,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </DataTable>
                            )}
                        </TabsContent>

                        <TabsContent value="relatorio" className="mt-4">
                            <FinanceReportPanel
                                params={{ period }}
                                hidden={hidden}
                            />
                        </TabsContent>

                        <TabsContent value="configuracoes" className="mt-4">
                            <FinanceSettingsPanel />
                        </TabsContent>
                    </Tabs>
                </main>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {editing ? 'Editar transação' : 'Nova transação'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Data</Label>
                            <Input
                                type="date"
                                value={form.date}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        date: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Descrição</Label>
                            <Input
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        description: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Tipo</Label>
                                <Select
                                    value={form.type}
                                    onValueChange={(v) =>
                                        setForm((f) => ({
                                            ...f,
                                            type: v as FinancialTransactionType,
                                            status:
                                                v === 'entrada'
                                                    ? 'recebido'
                                                    : 'pago',
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entrada">
                                            Entrada
                                        </SelectItem>
                                        <SelectItem value="saida">
                                            Saída
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Status</Label>
                                <Select
                                    value={form.status}
                                    onValueChange={(v) =>
                                        setForm((f) => ({
                                            ...f,
                                            status: v as FinancialTransactionStatus,
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(form.type === 'entrada'
                                            ? (['recebido', 'pendente'] as const)
                                            : (['pago', 'pendente'] as const)
                                        ).map((s) => (
                                            <SelectItem key={s} value={s}>
                                                {STATUS_LABELS[s]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Categoria</Label>
                            <Select
                                value={form.categoryId}
                                onValueChange={(v) =>
                                    setForm((f) => ({ ...f, categoryId: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {(categories ?? []).map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Método de pagamento</Label>
                            <Select
                                value={form.paymentMethod}
                                onValueChange={(v) =>
                                    setForm((f) => ({
                                        ...f,
                                        paymentMethod: v as PaymentMethod,
                                    }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PAYMENT_METHOD_LABELS).map(
                                        ([value, label]) => (
                                            <SelectItem
                                                key={value}
                                                value={value}
                                            >
                                                {label}
                                            </SelectItem>
                                        ),
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Valor (R$)</Label>
                                <Input
                                    type="number"
                                    min={0.01}
                                    step={0.01}
                                    value={form.grossAmount || ''}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            grossAmount: Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Taxa (opcional)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={form.feeAmount ?? ''}
                                    onChange={(e) =>
                                        setForm((f) => ({
                                            ...f,
                                            feeAmount: Number(e.target.value),
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => setDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="cursor-pointer"
                            onClick={handleSubmit}
                            disabled={
                                createMutation.isPending ||
                                updateMutation.isPending
                            }
                        >
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ClinicLayout>
    );
}
