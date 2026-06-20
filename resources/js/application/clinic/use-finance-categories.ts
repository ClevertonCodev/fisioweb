import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { FinancialTransactionType } from '@/domain/clinic/finance';
import { apiClinicFinanceCategoriesRepository } from '@/infrastructure/repositories/api-clinic-finance-categories';

export function useFinanceCategories(type?: FinancialTransactionType) {
    return useQuery({
        queryKey: ['finance', 'categories', type],
        queryFn: () => apiClinicFinanceCategoriesRepository.list(type),
    });
}

export function useCreateFinanceCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            name,
            type,
        }: {
            name: string;
            type: FinancialTransactionType;
        }) => apiClinicFinanceCategoriesRepository.create(name, type),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance', 'categories'] });
            toast.success('Categoria criada.');
        },
    });
}

export function useToggleFinanceCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClinicFinanceCategoriesRepository.toggleActive(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance', 'categories'] });
        },
    });
}

export function useDeleteFinanceCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClinicFinanceCategoriesRepository.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance', 'categories'] });
            toast.success('Categoria removida.');
        },
    });
}
