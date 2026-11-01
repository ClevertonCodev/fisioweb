/**
 * "A receber" ou "a pagar": as pendências até o fim do mês na tela, com as
 * atrasadas de meses anteriores primeiro (selo "Atrasado" e o mês na data).
 * Contagem e total vêm do servidor, não da página carregada.
 */
import { Check } from 'lucide-react';
import { useId } from 'react';

import { useFinancePending } from '@/application/clinic/use-finance-pending';
import { useSettleFinanceTransaction } from '@/application/clinic/use-finance-status';
import { DsBadge, DsButton } from '@/components/ds';
import type {
    FinancialTransaction,
    FinancialTransactionType,
} from '@/domain/clinic/finance';

import { endOfPeriod, money, pendingDayLabel } from './finance-format';
import { Amount } from './finance-parts';

export interface PendingListProps {
    type: FinancialTransactionType;
    period: string;
    todayKey: string;
    hidden: boolean;
    onOpen: (t: FinancialTransaction) => void;
}

export function PendingList({
    type,
    period,
    todayKey,
    hidden,
    onOpen,
}: PendingListProps) {
    const titleId = useId();
    const pending = useFinancePending(type, endOfPeriod(period));
    const settle = useSettleFinanceTransaction();
    const list = pending.data?.pages.flatMap((p) => p.data) ?? [];
    const meta = pending.data?.pages[0]?.meta;
    const label = type === 'entrada' ? 'A receber' : 'A pagar';
    const verb = type === 'entrada' ? 'Recebido' : 'Pago';

    return (
        <section
            aria-labelledby={titleId}
            className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs"
        >
            <header className="flex items-center justify-between border-b border-ds-border-subtle px-4 py-3">
                <h3 id={titleId} className="text-ds-body-sm font-semibold">
                    {meta ? `${label} (${meta.total})` : label}
                </h3>
                <span className="font-ds-mono text-ds-caption text-ds-content-secondary">
                    {meta ? money(meta.netTotal ?? 0, hidden) : ''}
                </span>
            </header>
            {pending.isLoading ? (
                <p className="px-4 py-6 text-center text-ds-body-xs text-ds-content-muted">
                    Carregando…
                </p>
            ) : pending.isError ? (
                <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-ds-body-xs text-ds-content-muted">
                    Não foi possível carregar as pendências.
                    <DsButton
                        size="sm"
                        variant="secondary"
                        label="Tentar de novo"
                        onClick={() => pending.refetch()}
                    />
                </div>
            ) : list.length === 0 ? (
                <p className="px-4 py-6 text-center text-ds-body-xs text-ds-content-muted">
                    Nada pendente.
                </p>
            ) : (
                <>
                    <ul className="divide-y divide-ds-border-subtle">
                        {list.map((t) => {
                            const late = t.date.slice(0, 10) < todayKey;
                            return (
                                <li
                                    key={t.id}
                                    className="flex items-center gap-3 px-4 py-2.5"
                                >
                                    <button
                                        type="button"
                                        onClick={() => onOpen(t)}
                                        className="min-w-0 flex-1 cursor-pointer text-left"
                                    >
                                        <span className="block truncate text-ds-body-xs font-medium">
                                            {t.description}
                                        </span>
                                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ds-caption text-ds-content-muted">
                                            <span className="whitespace-nowrap">
                                                {pendingDayLabel(
                                                    t.date.slice(0, 10),
                                                    period,
                                                )}
                                            </span>
                                            {t.patient?.name && (
                                                <span className="truncate">
                                                    {t.patient.name}
                                                </span>
                                            )}
                                            {late && (
                                                <DsBadge variant="danger">
                                                    Atrasado
                                                </DsBadge>
                                            )}
                                        </span>
                                    </button>
                                    <Amount
                                        t={t}
                                        hidden={hidden}
                                        className="text-ds-caption"
                                    />
                                    <DsButton
                                        size="sm"
                                        variant="secondary"
                                        iconPosition="left"
                                        icon={<Check />}
                                        label={verb}
                                        disabled={settle.isSettling(t.id)}
                                        onClick={() => settle.settle(t)}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                    {pending.hasNextPage && (
                        <div className="border-t border-ds-border-subtle p-3 text-center">
                            <DsButton
                                size="sm"
                                variant="secondary"
                                label={
                                    pending.isFetchingNextPage
                                        ? 'Carregando…'
                                        : 'Ver mais'
                                }
                                disabled={pending.isFetchingNextPage}
                                onClick={() => pending.fetchNextPage()}
                            />
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
