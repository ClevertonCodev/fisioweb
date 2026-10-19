/**
 * PROTÓTIPO C, "Calendário de caixa": o mês como calendário. Cada dia
 * mostra o que entrou e saiu (duas barrinhas, azul e vermelha, com o valor
 * escrito); tocar no dia lista os lançamentos dele ao lado. Embaixo, o que
 * falta: a receber e a pagar, com os atrasados primeiro e um botão para
 * dar baixa.
 */
import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { DsBadge, DsButton, dsCn } from '@/components/ds';
import type { FinancialTransaction } from '@/domain/clinic/finance';

import {
    EXPENSE_COLOR,
    INCOME_COLOR,
    money,
    parseDay,
    useMonthTransactions,
} from './data';
import { Amount, TransactionRow } from './parts';

export interface ListProps {
    period: string;
    hidden: boolean;
    onOpen: (t: FinancialTransaction) => void;
}

const WEEK = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

function compact(v: number, hidden: boolean) {
    if (hidden) return '•••';
    return v >= 1000
        ? `${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`
        : v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

export function VariantC({ period, hidden, onOpen }: ListProps) {
    const { all, loading } = useMonthTransactions(period);
    const [y, m] = period.split('-').map(Number) as [number, number];
    const [todayKey] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [picked, setPicked] = useState<string | null>(null);

    const byDay = useMemo(() => {
        const map = new Map<
            string,
            { in: number; out: number; list: FinancialTransaction[] }
        >();
        for (const t of all) {
            const k = t.date.slice(0, 10);
            const d = map.get(k) ?? { in: 0, out: 0, list: [] };
            if (t.type === 'entrada') d.in += t.netAmount;
            else d.out += t.netAmount;
            d.list.push(t);
            map.set(k, d);
        }
        return map;
    }, [all]);
    const max = Math.max(
        1,
        ...[...byDay.values()].flatMap((d) => [d.in, d.out]),
    );

    const first = new Date(y, m - 1, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const lead = (first.getDay() + 6) % 7;
    const cells: (string | null)[] = [
        ...Array.from({ length: lead }, () => null),
        ...Array.from(
            { length: daysInMonth },
            (_, i) => `${period}-${String(i + 1).padStart(2, '0')}`,
        ),
    ];

    const selected =
        picked ??
        (todayKey.startsWith(period)
            ? todayKey
            : ([...byDay.keys()].sort()[0] ?? null));
    const dayList = selected ? (byDay.get(selected)?.list ?? []) : [];

    const pending = all
        .filter((t) => t.status === 'pendente')
        .sort((a, b) => a.date.localeCompare(b.date));
    const toReceive = pending.filter((t) => t.type === 'entrada');
    const toPay = pending.filter((t) => t.type === 'saida');

    const pendingList = (
        title: string,
        list: FinancialTransaction[],
        verb: string,
    ) => (
        <section className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs">
            <header className="flex items-center justify-between border-b border-ds-border-subtle px-4 py-3">
                <h3 className="text-ds-body-sm font-semibold">{title}</h3>
                <span className="font-ds-mono text-ds-caption text-ds-content-secondary">
                    {money(
                        list.reduce((s, t) => s + t.netAmount, 0),
                        hidden,
                    )}
                </span>
            </header>
            {list.length === 0 ? (
                <p className="px-4 py-6 text-center text-ds-body-xs text-ds-content-muted">
                    Nada pendente.
                </p>
            ) : (
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
                                    <span className="flex items-center gap-2 text-ds-caption text-ds-content-muted">
                                        {parseDay(t.date).toLocaleDateString(
                                            'pt-BR',
                                            {
                                                day: '2-digit',
                                                month: '2-digit',
                                            },
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
                                    onClick={() =>
                                        toast.success(
                                            `Protótipo: "${t.description}" não foi marcado como ${verb.toLowerCase()}.`,
                                        )
                                    }
                                />
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <section className="min-w-0 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-3 shadow-ds-xs sm:p-4">
                    <div className="mb-3 flex items-center justify-end gap-4 text-ds-caption text-ds-content-secondary">
                        <span className="flex items-center gap-1.5">
                            <span
                                className="h-2 w-3 rounded-ds-xs"
                                style={{ background: INCOME_COLOR }}
                            />
                            Entradas
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span
                                className="h-2 w-3 rounded-ds-xs"
                                style={{ background: EXPENSE_COLOR }}
                            />
                            Saídas
                        </span>
                    </div>
                    <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-1">
                        {WEEK.map((w) => (
                            <span
                                key={w}
                                className="pb-1 text-center text-ds-micro text-ds-content-muted uppercase"
                            >
                                {w}
                            </span>
                        ))}
                        {cells.map((key, i) => {
                            if (!key) return <span key={`e${i}`} />;
                            const d = byDay.get(key);
                            const on = key === selected;
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    aria-pressed={on}
                                    aria-label={`Dia ${Number(key.slice(8))}${d ? `: entradas ${money(d.in, hidden)}, saídas ${money(d.out, hidden)}` : ''}`}
                                    onClick={() => setPicked(key)}
                                    className={dsCn(
                                        'flex min-h-20 cursor-pointer flex-col gap-1 rounded-ds-md border p-1.5 text-left transition-colors sm:min-h-24 sm:p-2',
                                        on
                                            ? 'border-ds-primary-80 bg-ds-surface-brand-subtle ds-dark:border-ds-primary-60'
                                            : 'border-ds-border-subtle hover:border-ds-border-brand-subtle',
                                        loading && 'animate-pulse',
                                    )}
                                >
                                    <span
                                        className={dsCn(
                                            'flex size-6 items-center justify-center rounded-ds-full font-ds-mono text-ds-caption',
                                            key === todayKey &&
                                                'bg-ds-primary-80 font-semibold text-ds-white ds-dark:bg-ds-primary-70',
                                        )}
                                    >
                                        {Number(key.slice(8))}
                                    </span>
                                    {d && (
                                        <span className="mt-auto flex flex-col gap-0.5">
                                            {d.in > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <span
                                                        className="h-1.5 rounded-ds-pill"
                                                        style={{
                                                            width: `${Math.max(8, (d.in / max) * 55)}%`,
                                                            background:
                                                                INCOME_COLOR,
                                                        }}
                                                    />
                                                    <span className="hidden font-ds-mono text-[10px] whitespace-nowrap text-ds-content-secondary sm:inline">
                                                        {compact(d.in, hidden)}
                                                    </span>
                                                </span>
                                            )}
                                            {d.out > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <span
                                                        className="h-1.5 rounded-ds-pill"
                                                        style={{
                                                            width: `${Math.max(8, (d.out / max) * 55)}%`,
                                                            background:
                                                                EXPENSE_COLOR,
                                                        }}
                                                    />
                                                    <span className="hidden font-ds-mono text-[10px] whitespace-nowrap text-ds-content-secondary sm:inline">
                                                        {compact(d.out, hidden)}
                                                    </span>
                                                </span>
                                            )}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs">
                    <header className="border-b border-ds-border-subtle px-4 py-3">
                        <h3 className="text-ds-body-sm font-semibold">
                            {selected
                                ? parseDay(selected).toLocaleDateString(
                                      'pt-BR',
                                      {
                                          weekday: 'long',
                                          day: '2-digit',
                                          month: 'long',
                                      },
                                  )
                                : 'Escolha um dia'}
                        </h3>
                        <p className="text-ds-caption text-ds-content-muted">
                            {dayList.length} lançamentos
                        </p>
                    </header>
                    {dayList.length === 0 ? (
                        <p className="px-4 py-8 text-center text-ds-body-xs text-ds-content-muted">
                            Nenhum lançamento neste dia.
                        </p>
                    ) : (
                        <ul className="max-h-[420px] divide-y divide-ds-border-subtle overflow-y-auto">
                            {dayList.map((t) => (
                                <li key={t.id}>
                                    <TransactionRow
                                        t={t}
                                        hidden={hidden}
                                        onOpen={() => onOpen(t)}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {pendingList(
                    `A receber (${toReceive.length})`,
                    toReceive,
                    'Recebido',
                )}
                {pendingList(`A pagar (${toPay.length})`, toPay, 'Pago')}
            </div>
        </div>
    );
}
