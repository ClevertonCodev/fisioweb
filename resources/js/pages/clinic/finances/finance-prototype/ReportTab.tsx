/**
 * PROTÓTIPO (descartável): aba Relatório. Tudo da API real de relatório:
 * números do mês com a variação, entradas × saídas dia a dia, os últimos
 * 12 meses, de onde vem e para onde vai (por categoria) e a tabela.
 * Cores: entradas azul (chart-c1) e saídas vermelho (chart-negative),
 * validadas para daltonismo nos dois temas; textos sempre em tinta de texto.
 */
import { useState } from 'react';

import {
    useFinanceCategoryBreakdown,
    useFinanceIncomeVsExpense,
    useFinanceMonthlyComparison,
    useFinanceReportSummary,
} from '@/application/clinic/use-finance-report';
import { dsCn } from '@/components/ds';
import type { CategoryBreakdownRow } from '@/domain/clinic/finance';

import { EXPENSE_COLOR, INCOME_COLOR, money, parseDay } from './data';

interface Point {
    key: string;
    label: string;
    tip: string;
    income: number;
    expense: number;
}

function Legend() {
    return (
        <div className="flex gap-4 text-ds-caption text-ds-content-secondary">
            <span className="flex items-center gap-1.5">
                <span
                    className="h-2.5 w-2.5 rounded-ds-xs"
                    style={{ background: INCOME_COLOR }}
                />
                Entradas
            </span>
            <span className="flex items-center gap-1.5">
                <span
                    className="h-2.5 w-2.5 rounded-ds-xs"
                    style={{ background: EXPENSE_COLOR }}
                />
                Saídas
            </span>
        </div>
    );
}

/** Barras lado a lado (entrada e saída) por ponto, com dica no hover. */
function PairedBars({
    points,
    hidden,
    labelEvery = 1,
}: {
    points: Point[];
    hidden: boolean;
    labelEvery?: number;
}) {
    const [hover, setHover] = useState<string | null>(null);
    const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expense]));
    const ticks = [1, 0.5, 0];
    const h = 180;
    return (
        <div className="relative">
            <div className="flex gap-2">
                <div
                    className="flex w-12 shrink-0 flex-col justify-between text-right font-ds-mono text-[10px] text-ds-content-muted"
                    style={{ height: h }}
                >
                    {ticks.map((t) => (
                        <span key={t}>
                            {hidden
                                ? '•••'
                                : Math.round((max * t) / 1000).toLocaleString(
                                      'pt-BR',
                                  ) + ' mil'}
                        </span>
                    ))}
                </div>
                <div className="relative min-w-0 flex-1">
                    {ticks.map((t) => (
                        <span
                            key={t}
                            className="absolute inset-x-0 border-t border-dashed border-ds-border-subtle"
                            style={{ top: (1 - t) * h }}
                        />
                    ))}
                    <div
                        className="relative flex items-end gap-[2px]"
                        style={{ height: h }}
                    >
                        {points.map((p) => (
                            <div
                                key={p.key}
                                className={dsCn(
                                    'relative flex h-full min-w-0 flex-1 items-end justify-center gap-[2px] rounded-ds-xs',
                                    hover === p.key && 'bg-ds-surface-subtle',
                                )}
                                onMouseEnter={() => setHover(p.key)}
                                onMouseLeave={() => setHover(null)}
                            >
                                <span
                                    className="w-full max-w-4 rounded-t-[4px]"
                                    style={{
                                        height: `${(p.income / max) * 100}%`,
                                        background: INCOME_COLOR,
                                    }}
                                />
                                <span
                                    className="w-full max-w-4 rounded-t-[4px]"
                                    style={{
                                        height: `${(p.expense / max) * 100}%`,
                                        background: EXPENSE_COLOR,
                                    }}
                                />
                                {hover === p.key && (
                                    <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max -translate-x-1/2 rounded-ds-md bg-ds-surface-inverse px-3 py-2 text-ds-caption text-ds-content-on-inverse shadow-ds-md">
                                        <span className="block font-semibold">
                                            {p.tip}
                                        </span>
                                        <span className="block">
                                            Entradas {money(p.income, hidden)}
                                        </span>
                                        <span className="block">
                                            Saídas {money(p.expense, hidden)}
                                        </span>
                                        <span className="block">
                                            Resultado{' '}
                                            {money(
                                                p.income - p.expense,
                                                hidden,
                                            )}
                                        </span>
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-1 flex gap-[2px]">
                        {points.map((p, i) => (
                            <span
                                key={p.key}
                                className="min-w-0 flex-1 text-center font-ds-mono text-[10px] text-ds-content-muted"
                            >
                                {i % labelEvery === 0 ? p.label : ''}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CategoryBars({
    title,
    rows,
    color,
    hidden,
}: {
    title: string;
    rows: CategoryBreakdownRow[];
    color: string;
    hidden: boolean;
}) {
    const sorted = [...rows].sort((a, b) => b.total - a.total);
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6);
    const list = rest.length
        ? [
              ...top,
              {
                  categoryId: -1,
                  name: `Outras (${rest.length})`,
                  type: top[0]?.type ?? 'entrada',
                  count: rest.reduce((s, r) => s + r.count, 0),
                  total: rest.reduce((s, r) => s + r.total, 0),
                  percentage: rest.reduce((s, r) => s + r.percentage, 0),
              },
          ]
        : top;
    const max = Math.max(1, ...list.map((r) => r.total));
    // A % da API é sobre entradas + saídas; aqui, dentro do próprio tipo.
    const sum = Math.max(
        1,
        rows.reduce((acc, r) => acc + r.total, 0),
    );
    return (
        <section className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
            <h3 className="mb-3 text-ds-body-sm font-semibold">{title}</h3>
            {list.length === 0 ? (
                <p className="py-6 text-center text-ds-body-xs text-ds-content-muted">
                    Nada no mês.
                </p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {list.map((r) => (
                        <li key={r.categoryId} className="flex flex-col gap-1">
                            <span className="flex items-baseline justify-between gap-3 text-ds-body-xs">
                                <span className="truncate">{r.name}</span>
                                <span className="shrink-0 font-ds-mono text-ds-content-secondary">
                                    {money(r.total, hidden)} ·{' '}
                                    {Math.round((r.total / sum) * 100)}%
                                </span>
                            </span>
                            <span className="h-2 overflow-hidden rounded-ds-pill bg-ds-surface-subtle">
                                <span
                                    className="block h-full rounded-ds-pill"
                                    style={{
                                        width: `${(r.total / max) * 100}%`,
                                        // "Outras" é soma, não categoria: cinza.
                                        background:
                                            r.categoryId === -1
                                                ? 'var(--ds-chart-comparison)'
                                                : color,
                                    }}
                                />
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export function ReportTab({
    period,
    hidden,
}: {
    period: string;
    hidden: boolean;
}) {
    const summary = useFinanceReportSummary({ period });
    const daily = useFinanceIncomeVsExpense({ period });
    const months = useFinanceMonthlyComparison();
    const breakdown = useFinanceCategoryBreakdown({ period });
    const [showTable, setShowTable] = useState(false);

    const s = summary.data;
    const tile = (
        label: string,
        value: number | undefined,
        variation: number | null | undefined,
        invert = false,
    ) => {
        const good =
            variation === null || variation === undefined
                ? null
                : invert
                  ? variation <= 0
                  : variation >= 0;
        return (
            <div className="flex flex-col gap-1 rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
                <span className="text-ds-caption text-ds-content-muted">
                    {label}
                </span>
                <span className="font-ds-mono text-ds-h4 font-semibold">
                    {value === undefined ? '…' : money(value, hidden)}
                </span>
                {variation !== null && variation !== undefined && (
                    <span
                        className={dsCn(
                            'text-ds-caption',
                            good
                                ? 'text-ds-status-success-content'
                                : 'text-ds-content-danger',
                        )}
                    >
                        {variation >= 0 ? '▲' : '▼'}{' '}
                        {Math.abs(Math.round(variation))}% em relação ao mês
                        anterior
                    </span>
                )}
            </div>
        );
    };

    const dailyPoints: Point[] = (daily.data ?? []).map((p) => ({
        key: p.date,
        label: String(parseDay(p.date).getDate()),
        tip: parseDay(p.date).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
        }),
        income: p.income,
        expense: p.expense,
    }));
    const monthPoints: Point[] = (months.data ?? []).map((p) => {
        const d = new Date(p.year, p.month - 1, 1);
        return {
            key: `${p.year}-${p.month}`,
            label: d
                .toLocaleDateString('pt-BR', { month: 'short' })
                .replace('.', ''),
            tip: d.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
            }),
            income: p.income,
            expense: p.expense,
        };
    });
    const rows = breakdown.data ?? [];

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3">
                {tile('Entradas do mês', s?.totals.income, s?.variation.income)}
                {tile(
                    'Saídas do mês',
                    s?.totals.expense,
                    s?.variation.expense,
                    true,
                )}
                {tile('Resultado', s?.totals.balance, s?.variation.balance)}
            </div>

            <section className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-ds-body-sm font-semibold">Dia a dia</h3>
                    <Legend />
                </div>
                {dailyPoints.length ? (
                    <PairedBars
                        points={dailyPoints}
                        hidden={hidden}
                        labelEvery={dailyPoints.length > 16 ? 3 : 1}
                    />
                ) : (
                    <p className="py-8 text-center text-ds-body-xs text-ds-content-muted">
                        Sem lançamentos no mês.
                    </p>
                )}
            </section>

            <section className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default p-4 shadow-ds-xs">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-ds-body-sm font-semibold">
                        Últimos 12 meses
                    </h3>
                    <Legend />
                </div>
                <PairedBars points={monthPoints} hidden={hidden} />
            </section>

            <div className="grid gap-4 md:grid-cols-2">
                <CategoryBars
                    title="De onde vem"
                    rows={rows.filter((r) => r.type === 'entrada')}
                    color={INCOME_COLOR}
                    hidden={hidden}
                />
                <CategoryBars
                    title="Para onde vai"
                    rows={rows.filter((r) => r.type === 'saida')}
                    color={EXPENSE_COLOR}
                    hidden={hidden}
                />
            </div>

            <section className="rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs">
                <button
                    type="button"
                    aria-expanded={showTable}
                    onClick={() => setShowTable(!showTable)}
                    className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-ds-body-sm font-semibold"
                >
                    Tabela por categoria ({rows.length})
                    <span className="text-ds-caption font-normal text-ds-content-brand ds-dark:text-ds-primary-60">
                        {showTable ? 'Esconder' : 'Mostrar'}
                    </span>
                </button>
                {showTable && (
                    <div className="overflow-x-auto border-t border-ds-border-subtle">
                        <table className="w-full text-ds-body-xs">
                            <thead className="bg-ds-surface-subtle text-left text-ds-caption text-ds-content-muted">
                                <tr>
                                    <th className="px-4 py-2 font-medium">
                                        Categoria
                                    </th>
                                    <th className="px-4 py-2 font-medium">
                                        Tipo
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        Lançamentos
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        Total
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium">
                                        % do mês
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-ds-border-subtle">
                                {[...rows]
                                    .sort((a, b) => b.total - a.total)
                                    .map((r) => (
                                        <tr key={`${r.type}-${r.categoryId}`}>
                                            <td className="px-4 py-2">
                                                {r.name}
                                            </td>
                                            <td className="px-4 py-2 text-ds-content-secondary">
                                                {r.type === 'entrada'
                                                    ? 'Entrada'
                                                    : 'Saída'}
                                            </td>
                                            <td className="px-4 py-2 text-right font-ds-mono">
                                                {r.count}
                                            </td>
                                            <td className="px-4 py-2 text-right font-ds-mono">
                                                {money(r.total, hidden)}
                                            </td>
                                            <td className="px-4 py-2 text-right font-ds-mono">
                                                {Math.round(r.percentage)}%
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
