import { useMemo } from 'react';

import type { FinancialTransactionType } from '@/domain/clinic/finance';

import { topCategories } from './finance-transaction-form';
import { useFinanceCategories } from './use-finance-categories';
import { useFinanceCategoryBreakdown } from './use-finance-report';

/**
 * Categorias do modal de lançamento: as ligadas do tipo (lista com busca) e
 * as mais usadas no mês na tela (chips), pela contagem do `category-breakdown`.
 * Usa a mesma chave do relatório, então as duas telas dividem o cache.
 */
export function useFinanceTopCategories(
    period: string,
    type: FinancialTransactionType,
) {
    const categories = useFinanceCategories(type);
    const breakdown = useFinanceCategoryBreakdown({ period });
    const active = useMemo(
        () => (categories.data ?? []).filter((c) => c.active),
        [categories.data],
    );
    const top = useMemo(
        () => topCategories(breakdown.data ?? [], active, type),
        [breakdown.data, active, type],
    );
    return { active, top };
}
