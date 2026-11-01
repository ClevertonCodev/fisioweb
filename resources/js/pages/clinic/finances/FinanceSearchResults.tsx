/**
 * Busca em todo o histórico do caixa. Fica no topo da lista do dia: com texto,
 * o resultado (com a data de cada lançamento) toma o lugar da lista do dia;
 * limpar volta ao dia. Filtra só por tipo.
 */
import { Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { useFinanceSearch } from '@/application/clinic/use-finance-search';
import { DsButton, DsInput, dsCn } from '@/components/ds';
import type {
    FinancialTransaction,
    FinancialTransactionType,
} from '@/domain/clinic/finance';
import { useDebounce } from '@/lib/use-debounce';

import { TransactionRow } from './finance-parts';

const TYPE_CHIPS: [FinancialTransactionType | null, string][] = [
    [null, 'Tudo'],
    ['entrada', 'Entradas'],
    ['saida', 'Saídas'],
];

const chip = (selected: boolean) =>
    dsCn(
        'cursor-pointer rounded-ds-pill border px-3 py-1 text-ds-caption transition-colors focus-visible:shadow-ds-focus focus-visible:outline-0',
        selected
            ? 'border-ds-primary-80 bg-ds-surface-brand-subtle font-medium text-ds-content-brand ds-dark:border-ds-primary-60 ds-dark:text-ds-primary-60'
            : 'border-ds-border-default text-ds-content-secondary hover:border-ds-border-brand-subtle',
    );

interface PanelProps {
    hidden: boolean;
    onOpen: (t: FinancialTransaction) => void;
    /** A lista do dia, mostrada enquanto não há texto na busca. */
    children: ReactNode;
}

export function FinanceSearchPanel({ hidden, onOpen, children }: PanelProps) {
    const [input, setInput] = useState('');
    const [type, setType] = useState<FinancialTransactionType | null>(null);
    const q = useDebounce(input.trim(), 300);
    const searching = input.trim() !== '';

    return (
        <>
            <div className="flex flex-col gap-2 border-b border-ds-border-subtle px-4 py-3">
                <DsInput
                    type="search"
                    size="sm"
                    aria-label="Buscar lançamentos"
                    placeholder="Buscar em todo o histórico"
                    iconLeft={<Search />}
                    value={input}
                    onValueChange={setInput}
                    onCleared={() => setInput('')}
                />
                {searching && (
                    <div
                        role="radiogroup"
                        aria-label="Tipo da busca"
                        className="flex flex-wrap gap-2"
                    >
                        {TYPE_CHIPS.map(([key, label]) => (
                            <button
                                key={label}
                                type="button"
                                role="radio"
                                aria-checked={type === key}
                                onClick={() => setType(key)}
                                className={chip(type === key)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {searching ? (
                <FinanceSearchResults
                    q={q}
                    pending={q !== input.trim()}
                    type={type}
                    hidden={hidden}
                    onOpen={onOpen}
                />
            ) : (
                children
            )}
        </>
    );
}

interface ResultsProps {
    q: string;
    /** O texto ainda está mudando (espera da digitação). */
    pending: boolean;
    type: FinancialTransactionType | null;
    hidden: boolean;
    onOpen: (t: FinancialTransaction) => void;
}

export function FinanceSearchResults({
    q,
    pending,
    type,
    hidden,
    onOpen,
}: ResultsProps) {
    const search = useFinanceSearch(q, type);
    const results = search.data?.pages.flatMap((p) => p.data) ?? [];
    const total = search.data?.pages[0]?.meta.total ?? 0;
    const loading = pending || search.isLoading || q === '';

    return (
        <section aria-label="Resultado da busca">
            <p
                aria-live="polite"
                className="px-4 pt-3 text-ds-caption text-ds-content-muted"
            >
                {loading
                    ? 'Buscando…'
                    : total === 1
                      ? '1 resultado'
                      : `${total} resultados`}
            </p>
            {loading ? null : search.isError ? (
                <div className="flex flex-col items-center gap-2 px-4 py-8 text-center text-ds-body-xs text-ds-content-muted">
                    Não foi possível buscar.
                    <DsButton
                        size="sm"
                        variant="secondary"
                        label="Tentar de novo"
                        onClick={() => search.refetch()}
                    />
                </div>
            ) : results.length === 0 ? (
                <p className="px-4 py-8 text-center text-ds-body-xs text-ds-content-muted">
                    Nenhum lançamento encontrado para “{q}”.
                </p>
            ) : (
                <div className="max-h-[420px] overflow-y-auto">
                    <ul className="divide-y divide-ds-border-subtle">
                        {results.map((t) => (
                            <li key={t.id}>
                                <TransactionRow
                                    t={t}
                                    hidden={hidden}
                                    showDate
                                    onOpen={() => onOpen(t)}
                                />
                            </li>
                        ))}
                    </ul>
                    {search.hasNextPage && (
                        <div className="border-t border-ds-border-subtle p-3 text-center">
                            <DsButton
                                size="sm"
                                variant="secondary"
                                label={
                                    search.isFetchingNextPage
                                        ? 'Carregando…'
                                        : 'Ver mais'
                                }
                                disabled={search.isFetchingNextPage}
                                onClick={() => search.fetchNextPage()}
                            />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
