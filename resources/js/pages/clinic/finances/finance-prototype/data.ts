/**
 * PROTÓTIPO (descartável): dados de Finanças, comuns às variantes. Tudo
 * vem da API real (lançamentos, resumo, relatório, categorias, lixeira);
 * criar, editar, excluir, restaurar e mudar categoria são stub.
 *
 * A lista da API pagina em no máximo 50: o calendário busca as duas primeiras páginas do mês (até 100 lançamentos). Na tela
 * de verdade, viriam por um endpoint do mês inteiro ou por rolagem.
 */
import { useMemo } from 'react';

import { useFinanceCategories } from '@/application/clinic/use-finance-categories';
import {
    useFinanceSummary,
    useFinanceTransactions,
} from '@/application/clinic/use-finance-transactions';
import type { FinancialTransactionType } from '@/domain/clinic/finance';

export const FINANCE_VARIANTS = [
    { key: 'O', name: 'Tela atual (v1)' },
    { key: 'C', name: 'Calendário de caixa' },
] as const;

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

/** Os lançamentos do mês inteiro (até 100), para o extrato e o calendário. */
export function useMonthTransactions(period: string) {
    const p1 = useFinanceTransactions({ period, page: 1, perPage: 50 });
    const p2 = useFinanceTransactions({ period, page: 2, perPage: 50 });
    const all = useMemo(() => {
        const list = [...(p1.data?.data ?? [])];
        if ((p1.data?.meta.total ?? 0) > 50)
            list.push(...(p2.data?.data ?? []));
        return list.sort(
            (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
        );
    }, [p1.data, p2.data]);
    return {
        all,
        total: p1.data?.meta.total ?? 0,
        loading: p1.isLoading,
        truncated: (p1.data?.meta.total ?? 0) > 100,
    };
}

export function useMonthSummary(period: string) {
    return useFinanceSummary({ period });
}

export function useCategories(type?: FinancialTransactionType) {
    return useFinanceCategories(type);
}
