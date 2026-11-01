import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiClinicFinanceCalendarRepository } from '@/infrastructure/repositories/api-clinic-finance-calendar';
import { apiClinicFinanceTransactionsRepository } from '@/infrastructure/repositories/api-clinic-finance-transactions';

export const FINANCE_DAY_PAGE_SIZE = 25;

/** Entrou e saiu (líquido) por dia do mês, somado no servidor. */
export function useFinanceCalendar(period: string) {
    return useQuery({
        queryKey: ['finance', 'calendar', period],
        queryFn: () => apiClinicFinanceCalendarRepository.getMonth(period),
    });
}

/** Lançamentos de um dia (`from = to = dia`), uma página por vez ("ver mais"). */
export function useFinanceDayTransactions(day: string | null) {
    return useInfiniteQuery({
        queryKey: ['finance', 'day', day],
        enabled: !!day,
        initialPageParam: 1,
        queryFn: ({ pageParam }) =>
            apiClinicFinanceTransactionsRepository.list({
                from: day!,
                to: day!,
                page: pageParam,
                perPage: FINANCE_DAY_PAGE_SIZE,
            }),
        getNextPageParam: (last) =>
            last.meta.page * last.meta.perPage < last.meta.total
                ? last.meta.page + 1
                : undefined,
    });
}
