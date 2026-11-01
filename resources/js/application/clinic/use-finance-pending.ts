import { useInfiniteQuery } from '@tanstack/react-query';

import type { FinancialTransactionType } from '@/domain/clinic/finance';
import { apiClinicFinanceTransactionsRepository } from '@/infrastructure/repositories/api-clinic-finance-transactions';

export const FINANCE_PENDING_PAGE_SIZE = 25;

/**
 * "A receber" (entrada) ou "a pagar" (saída): as pendências com data até `until`
 * (o fim do mês na tela), incluindo as atrasadas de meses anteriores, da mais
 * antiga para a mais nova. O total e a contagem vêm do servidor (`meta`).
 */
export function useFinancePending(
    type: FinancialTransactionType,
    until: string,
) {
    return useInfiniteQuery({
        queryKey: ['finance', 'pending', type, until],
        initialPageParam: 1,
        queryFn: ({ pageParam }) =>
            apiClinicFinanceTransactionsRepository.list({
                overdueUntil: until,
                status: 'pendente',
                type,
                sort: 'date',
                page: pageParam,
                perPage: FINANCE_PENDING_PAGE_SIZE,
            }),
        getNextPageParam: (last) =>
            last.meta.page * last.meta.perPage < last.meta.total
                ? last.meta.page + 1
                : undefined,
    });
}
