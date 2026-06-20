import { useQuery } from '@tanstack/react-query';

import type { FinanceListParams } from '@/domain/clinic/finance';
import { apiClinicFinanceReportRepository } from '@/infrastructure/repositories/api-clinic-finance-report';

export function useFinanceReportSummary(params: FinanceListParams = {}) {
    return useQuery({
        queryKey: ['finance', 'report', 'summary', params],
        queryFn: () => apiClinicFinanceReportRepository.getSummary(params),
    });
}

export function useFinanceIncomeVsExpense(params: FinanceListParams = {}) {
    return useQuery({
        queryKey: ['finance', 'report', 'income-vs-expense', params],
        queryFn: () =>
            apiClinicFinanceReportRepository.getIncomeVsExpense(params),
    });
}

export function useFinanceCategoryDistribution(params: FinanceListParams = {}) {
    return useQuery({
        queryKey: ['finance', 'report', 'category-distribution', params],
        queryFn: () =>
            apiClinicFinanceReportRepository.getCategoryDistribution(params),
    });
}

export function useFinanceMonthlyComparison() {
    return useQuery({
        queryKey: ['finance', 'report', 'monthly-comparison'],
        queryFn: () => apiClinicFinanceReportRepository.getMonthlyComparison(),
    });
}

export function useFinanceCategoryBreakdown(params: FinanceListParams = {}) {
    return useQuery({
        queryKey: ['finance', 'report', 'category-breakdown', params],
        queryFn: () =>
            apiClinicFinanceReportRepository.getCategoryBreakdown(params),
    });
}
