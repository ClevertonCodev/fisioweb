import { useInfiniteQuery } from '@tanstack/react-query';

import type { FinancialTransactionType } from '@/domain/clinic/finance';
import { apiClinicFinanceTransactionsRepository } from '@/infrastructure/repositories/api-clinic-finance-transactions';

export const FINANCE_SEARCH_PAGE_SIZE = 25;

/**
 * Busca em todo o histórico: `q` sem `period`/`from`/`to`, da data mais nova
 * para a mais antiga, uma página por vez ("ver mais"). Sem texto, não busca.
 */
export function useFinanceSearch(
    q: string,
    type: FinancialTransactionType | null,
) {
    const term = q.trim();
    return useInfiniteQuery({
        queryKey: ['finance', 'search', { q: term, type }],
        enabled: term !== '',
        initialPageParam: 1,
        queryFn: ({ pageParam }) =>
            apiClinicFinanceTransactionsRepository.list({
                q: term,
                ...(type && { type }),
                page: pageParam,
                perPage: FINANCE_SEARCH_PAGE_SIZE,
            }),
        getNextPageParam: (last) =>
            last.meta.page * last.meta.perPage < last.meta.total
                ? last.meta.page + 1
                : undefined,
    });
}
