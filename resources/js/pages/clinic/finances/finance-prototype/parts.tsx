/** PROTÓTIPO (descartável): peças comuns de Finanças. */
import {
    ArrowDownLeft,
    ArrowUpRight,
    Banknote,
    Building2,
    Car,
    ChevronLeft,
    ChevronRight,
    Dumbbell,
    GraduationCap,
    HeartPulse,
    Home,
    Megaphone,
    Package,
    Pencil,
    Phone,
    Receipt,
    Stethoscope,
    Users,
    UtensilsCrossed,
    Wifi,
    Zap,
    type LucideIcon,
} from 'lucide-react';

import { DsBadge, DsButton, dsCn } from '@/components/ds';
import type { MonthlySummary } from '@/domain/clinic/finance';
import {
    PAYMENT_METHOD_LABELS,
    type FinancialTransaction,
} from '@/domain/clinic/finance';

import { money, parseDay, periodLabel, shiftPeriod } from './data';

const ICONS: [RegExp, LucideIcon][] = [
    [/atendimento|avalia/i, Stethoscope],
    [/pilates|aula/i, Dumbbell],
    [/consultoria/i, GraduationCap],
    [/venda|produto|equipamento|material/i, Package],
    [/aluguel/i, Home],
    [/sal[áa]rio|terceiriz/i, Users],
    [/energia/i, Zap],
    [/internet/i, Wifi],
    [/telefone/i, Phone],
    [/marketing/i, Megaphone],
    [/combust|transporte/i, Car],
    [/aliment/i, UtensilsCrossed],
    [/plano de sa[úu]de/i, HeartPulse],
    [/imposto|contabil/i, Building2],
    [/[áa]gua|assinatura/i, Receipt],
];

export function CategoryIcon({
    t,
    size = 36,
}: {
    t: Pick<FinancialTransaction, 'type'> & { category: { name: string } };
    size?: number;
}) {
    const Icon =
        ICONS.find(([re]) => re.test(t.category.name))?.[1] ??
        (t.type === 'entrada' ? ArrowDownLeft : ArrowUpRight);
    return (
        <span
            aria-hidden="true"
            className={dsCn(
                'flex shrink-0 items-center justify-center rounded-ds-md',
                t.type === 'entrada'
                    ? 'bg-ds-surface-brand-subtle text-ds-content-brand ds-dark:text-ds-primary-60'
                    : 'bg-ds-status-danger-surface text-ds-status-danger-content',
            )}
            style={{ width: size, height: size }}
        >
            <Icon style={{ width: size * 0.48, height: size * 0.48 }} />
        </span>
    );
}

/** Valor com sinal e cor de texto (a cor é do texto, não da série). */
export function Amount({
    t,
    hidden,
    className,
}: {
    t: FinancialTransaction;
    hidden: boolean;
    className?: string;
}) {
    return (
        <span
            className={dsCn(
                'font-ds-mono font-semibold whitespace-nowrap',
                t.type === 'entrada'
                    ? 'text-ds-content-primary'
                    : 'text-ds-content-danger',
                t.status === 'pendente' && 'opacity-60',
                className,
            )}
        >
            {t.type === 'entrada' ? '+' : '−'} {money(t.netAmount, hidden)}
        </span>
    );
}

export function StatusPill({ t }: { t: FinancialTransaction }) {
    if (t.status !== 'pendente') return null;
    return (
        <DsBadge variant="warning" dot>
            {t.type === 'entrada' ? 'A receber' : 'A pagar'}
        </DsBadge>
    );
}

export function TransactionRow({
    t,
    hidden,
    onOpen,
    showDate,
}: {
    t: FinancialTransaction;
    hidden: boolean;
    onOpen: () => void;
    showDate?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-ds-surface-subtle focus-visible:shadow-ds-focus focus-visible:outline-0"
        >
            <CategoryIcon t={t} />
            <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-ds-body-xs font-medium">
                        {t.description}
                    </span>
                    <StatusPill t={t} />
                </span>
                <span className="block truncate text-ds-caption text-ds-content-muted">
                    {showDate &&
                        `${parseDay(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} · `}
                    {t.category.name} · {PAYMENT_METHOD_LABELS[t.paymentMethod]}
                    {t.feeAmount > 0 && ` · taxa ${money(t.feeAmount, hidden)}`}
                </span>
            </span>
            <Amount t={t} hidden={hidden} className="text-ds-body-xs" />
        </button>
    );
}

export function MonthSwitcher({
    period,
    onChange,
}: {
    period: string;
    onChange: (p: string) => void;
}) {
    return (
        <div className="flex items-center gap-1 rounded-ds-lg border border-ds-border-subtle bg-ds-surface-default p-1">
            <DsButton
                size="sm"
                variant="tertiary"
                iconPosition="only"
                icon={<ChevronLeft />}
                label="Mês anterior"
                onClick={() => onChange(shiftPeriod(period, -1))}
            />
            <span className="min-w-36 text-center text-ds-body-xs font-semibold">
                {periodLabel(period)}
            </span>
            <DsButton
                size="sm"
                variant="tertiary"
                iconPosition="only"
                icon={<ChevronRight />}
                label="Próximo mês"
                onClick={() => onChange(shiftPeriod(period, 1))}
            />
        </div>
    );
}

/** O mês em números: disponível em destaque, entradas, saídas e previsto. */
export function SummaryStrip({
    s,
    hidden,
    loading,
    onEditOpening,
}: {
    s: MonthlySummary | undefined;
    hidden: boolean;
    loading: boolean;
    onEditOpening: () => void;
}) {
    const cell = (
        label: string,
        value: number | undefined,
        sub?: React.ReactNode,
        tone?: 'danger',
    ) => (
        <div className="flex min-w-0 flex-col gap-0.5 p-4">
            <span className="text-ds-caption text-ds-content-muted">
                {label}
            </span>
            {loading || value === undefined ? (
                <span className="my-1 h-6 w-24 animate-pulse rounded-ds-sm bg-ds-surface-subtle" />
            ) : (
                <span
                    className={dsCn(
                        'font-ds-mono text-ds-body-lg font-semibold',
                        tone === 'danger' && 'text-ds-content-danger',
                    )}
                >
                    {money(value, hidden)}
                </span>
            )}
            {sub && (
                <span className="truncate text-ds-caption text-ds-content-secondary">
                    {sub}
                </span>
            )}
        </div>
    );
    return (
        <section
            aria-label="Resumo do mês"
            className="grid overflow-hidden rounded-ds-xl border border-ds-border-subtle bg-ds-surface-default shadow-ds-xs md:grid-cols-[1.3fr_1fr_1fr_1fr]"
        >
            <div className="flex flex-col gap-1 bg-[image:var(--ds-gradient-brand)] p-5 text-ds-content-on-brand">
                <span className="text-ds-eyebrow uppercase opacity-80">
                    Disponível agora
                </span>
                {loading || !s ? (
                    <span className="my-1 h-8 w-36 animate-pulse rounded-ds-sm bg-ds-white/20" />
                ) : (
                    <span className="font-ds-mono text-ds-h3 font-semibold">
                        {money(s.available, hidden)}
                    </span>
                )}
                <button
                    type="button"
                    onClick={onEditOpening}
                    className="flex w-fit cursor-pointer items-center gap-1.5 text-ds-caption opacity-90 hover:opacity-100 [&_svg]:size-3.5"
                >
                    Saldo inicial {s ? money(s.openingBalance, hidden) : '…'}
                    <Pencil />
                </button>
            </div>
            <div className="grid grid-cols-1 divide-y divide-ds-border-subtle sm:grid-cols-3 sm:divide-x sm:divide-y-0 md:contents md:divide-x-0">
                {cell(
                    'Entradas',
                    s?.income.received,
                    s && (
                        <>
                            <Banknote className="mr-1 inline size-3.5" />+{' '}
                            {money(s.income.pending, hidden)} a receber
                        </>
                    ),
                )}
                {cell(
                    'Saídas',
                    s?.expense.paid,
                    s && <>+ {money(s.expense.pending, hidden)} a pagar</>,
                    'danger',
                )}
                {cell(
                    'Previsto no fim do mês',
                    s?.forecast,
                    'com o que falta receber e pagar',
                )}
            </div>
        </section>
    );
}
