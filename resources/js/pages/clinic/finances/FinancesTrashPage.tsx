import {
    useFinanceTrash,
    useRestoreFinanceTransaction,
} from '@/application/clinic/use-finance-transactions';
import {
    formatFinanceMoney,
    useFinanceValuesVisibility,
} from '@/application/clinic/use-finance-values-visibility';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { TableCell, TableRow } from '@/components/ui/table';
import type { FinancialTransaction } from '@/domain/clinic/finance';

export default function FinancesTrashPage() {
    const { hidden } = useFinanceValuesVisibility();
    const { data } = useFinanceTrash({ page: 1, perPage: 25 });
    const restoreMutation = useRestoreFinanceTransaction();

    const columns: DataTableColumn[] = [
        { key: 'date', title: 'Data' },
        { key: 'description', title: 'Descrição' },
        { key: 'category', title: 'Categoria' },
        { key: 'type', title: 'Tipo' },
        { key: 'grossAmount', title: 'Valor' },
        { key: 'deletedBy', title: 'Quem excluiu' },
        { key: 'actions', title: '' },
    ];

    return (
        <ClinicLayout>
            <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                    <h1 className="text-2xl font-semibold">Lixeira</h1>
                    <BackButton to="/clinica/financas" />
                </div>
                <DataTable<FinancialTransaction>
                    columns={columns}
                    data={data?.data ?? []}
                    emptyMessage="Nenhuma transação excluída"
                    totalCount={data?.meta.total ?? 0}
                >
                    {(row) => (
                        <TableRow key={row.id}>
                            <TableCell>
                                {new Date(row.date).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>{row.description}</TableCell>
                            <TableCell>{row.category.name}</TableCell>
                            <TableCell>{row.type}</TableCell>
                            <TableCell>
                                {formatFinanceMoney(row.grossAmount, hidden)}
                            </TableCell>
                            <TableCell>{row.deletedBy?.name ?? '—'}</TableCell>
                            <TableCell>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={() => restoreMutation.mutate(row.id)}
                                >
                                    Restaurar
                                </Button>
                            </TableCell>
                        </TableRow>
                    )}
                </DataTable>
            </div>
        </ClinicLayout>
    );
}
