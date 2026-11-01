/**
 * Seção "Lixeira" das Configurações de Finanças: os lançamentos excluídos da
 * clínica (paginados pelo servidor) com "Restaurar". Administrador e
 * secretária veem e restauram. Restaurar invalida ['finance'], então o
 * lançamento volta ao calendário, às pendências, ao resumo e ao relatório.
 */
import { RotateCcw } from 'lucide-react';
import { useId, useState } from 'react';

import {
    useFinanceTrash,
    useRestoreFinanceTransaction,
} from '@/application/clinic/use-finance-transactions';
import { DsButton, DsPagination } from '@/components/ds';

import { parseDay } from './finance-format';
import { Amount, CategoryIcon } from './finance-parts';

const PER_PAGE = 25;

export function FinanceTrashSection({
    className,
    hidden,
}: {
    className?: string;
    hidden: boolean;
}) {
    const headingId = useId();
    const [page, setPage] = useState(1);
    const trash = useFinanceTrash({ page, perPage: PER_PAGE });
    const restore = useRestoreFinanceTransaction();
    const deleted = trash.data?.data ?? [];
    const total = trash.data?.meta.total ?? 0;
    // Restaurar o último item de uma página: volta para a página anterior.
    const restoreItem = (id: string) =>
        restore.mutate(id, {
            onSuccess: () => {
                if (deleted.length === 1 && page > 1) setPage(page - 1);
            },
        });

    return (
        <section
            id="fin-lixeira"
            aria-labelledby={headingId}
            className={className}
        >
            <h3 id={headingId} className="text-ds-body-emphasis">
                Lixeira{trash.data ? ` (${total})` : ''}
            </h3>
            <p className="mb-4 text-ds-caption text-ds-content-muted">
                Lançamentos excluídos. Restaurar devolve ao mês de origem.
            </p>
            {trash.isLoading ? (
                <p className="py-6 text-center text-ds-body-xs text-ds-content-muted">
                    Carregando…
                </p>
            ) : trash.isError ? (
                <p className="py-6 text-center text-ds-body-xs text-ds-content-muted">
                    Não foi possível carregar a lixeira.
                </p>
            ) : deleted.length === 0 ? (
                <p className="py-6 text-center text-ds-body-xs text-ds-content-muted">
                    A lixeira está vazia.
                </p>
            ) : (
                <>
                    <ul className="divide-y divide-ds-border-subtle rounded-ds-lg border border-ds-border-subtle">
                        {deleted.map((t) => (
                            <li
                                key={t.id}
                                className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5"
                            >
                                <CategoryIcon t={t} size={28} />
                                {/* basis-48: no celular o texto fica com a linha
                                    toda, e valor + Restaurar descem. */}
                                <span className="min-w-0 flex-1 basis-48">
                                    <span className="block truncate text-ds-body-xs font-medium">
                                        {t.description}
                                    </span>
                                    <span className="block text-ds-caption text-ds-content-muted">
                                        {parseDay(t.date).toLocaleDateString(
                                            'pt-BR',
                                        )}{' '}
                                        · excluído
                                        {t.deletedAt &&
                                            ` em ${new Date(t.deletedAt).toLocaleDateString('pt-BR')}`}
                                        {t.deletedBy &&
                                            ` por ${t.deletedBy.name}`}
                                    </span>
                                </span>
                                <span className="ml-auto flex items-center gap-3">
                                    <Amount
                                        t={t}
                                        hidden={hidden}
                                        className="text-ds-caption"
                                    />
                                    <DsButton
                                        size="sm"
                                        variant="secondary"
                                        iconPosition="left"
                                        icon={<RotateCcw />}
                                        label="Restaurar"
                                        aria-label={`Restaurar ${t.description}`}
                                        loading={
                                            restore.isPending &&
                                            restore.variables === t.id
                                        }
                                        disabled={restore.isPending}
                                        onClick={() => restoreItem(t.id)}
                                    />
                                </span>
                            </li>
                        ))}
                    </ul>
                    {total > PER_PAGE && (
                        <DsPagination
                            className="mt-4"
                            page={page}
                            onPageChange={setPage}
                            total={total}
                            perPage={PER_PAGE}
                            itemLabel="lançamentos"
                        />
                    )}
                </>
            )}
        </section>
    );
}
