import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ApiErrorResponse } from '@/domain/api';
import type {
    FinancialCategory,
    FinancialTransactionType,
} from '@/domain/clinic/finance';
import { apiClinicFinanceCategoriesRepository } from '@/infrastructure/repositories/api-clinic-finance-categories';

export function useFinanceCategories(type?: FinancialTransactionType) {
    return useQuery({
        queryKey: ['finance', 'categories', type],
        queryFn: () => apiClinicFinanceCategoriesRepository.list(type),
    });
}

/** Ligadas e desligadas, para a seção de categorias das Configurações. */
export function useFinanceSettingsCategories() {
    return useQuery({
        queryKey: ['finance', 'categories', 'settings'],
        queryFn: () =>
            apiClinicFinanceCategoriesRepository.list(undefined, {
                includeInactive: true,
            }),
    });
}

function apiMessage(err: ApiErrorResponse, fallback: string): string {
    return err?.response?.data?.message ?? fallback;
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
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success(`Categoria "${created.name}" criada.`);
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(apiMessage(err, 'Não foi possível criar a categoria.'));
        },
    });
}

export function useToggleFinanceCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (category: FinancialCategory) =>
            apiClinicFinanceCategoriesRepository.toggleActive(category.id),
        onSuccess: (_, category) => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success(
                `"${category.name}" ${category.active ? 'desligada' : 'ligada'}.`,
            );
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(apiMessage(err, 'Não foi possível mudar a categoria.'));
        },
    });
}

export function useDeleteFinanceCategory() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (category: FinancialCategory) =>
            apiClinicFinanceCategoriesRepository.remove(category.id),
        onSuccess: (_, category) => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success(`Categoria "${category.name}" excluída.`);
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(
                apiMessage(err, 'Não foi possível excluir a categoria.'),
            );
        },
    });
}
