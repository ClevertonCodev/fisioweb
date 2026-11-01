/** Formatação pura de Finanças: período, dia, dinheiro e cores dos gráficos. */

/** Cores dos gráficos (validadas para daltonismo, claro e escuro). */
export const INCOME_COLOR = 'var(--ds-chart-c1)';
export const EXPENSE_COLOR = 'var(--ds-chart-negative)';

export function periodOf(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftPeriod(period: string, delta: number): string {
    const [y, m] = period.split('-').map(Number);
    return periodOf(new Date(y!, m! - 1 + delta, 1));
}

export function periodLabel(period: string): string {
    const [y, m] = period.split('-').map(Number);
    const label = new Date(y!, m! - 1, 1).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "2026-10-19" sem passar por UTC (dia certo no fuso local). */
export function parseDay(iso: string): Date {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y!, m! - 1, d!);
}

export function money(value: number, hidden: boolean): string {
    if (hidden) return 'R$ •••';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

/** Último dia do mês ("2026-02" → "2026-02-28"). */
export function endOfPeriod(period: string): string {
    const [y, m] = period.split('-').map(Number);
    const last = new Date(y!, m!, 0).getDate();
    return `${period}-${String(last).padStart(2, '0')}`;
}

/**
 * Data de uma pendência: só o dia quando é do mês na tela ("dia 20");
 * com o mês quando é de outro ("10 de set."), e com o ano quando é de outro ano.
 */
export function pendingDayLabel(iso: string, period: string): string {
    if (iso.slice(0, 7) === period) return `dia ${Number(iso.slice(8, 10))}`;
    const date = parseDay(iso);
    return date.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'short',
        ...(iso.slice(0, 4) !== period.slice(0, 4) && { year: 'numeric' }),
    });
}
