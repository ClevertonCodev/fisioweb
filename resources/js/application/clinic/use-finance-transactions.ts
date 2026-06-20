import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
    FinanceListParams,
    FinanceTransactionWriteDto,
    OpeningBalance,
} from '@/domain/clinic/finance';
import {
    apiClinicFinanceOpeningBalanceRepository,
    apiClinicFinanceSummaryRepository,
    apiClinicFinanceTransactionsRepository,
} from '@/infrastructure/repositories/api-clinic-finance-transactions';

export function useFinanceTransactions(params: FinanceListParams = {}) {
    return useQuery({
        queryKey: ['finance', 'transactions', params],
        queryFn: () => apiClinicFinanceTransactionsRepository.list(params),
    });
}

export function useFinanceTrash(params: FinanceListParams = {}) {
    return useQuery({
        queryKey: ['finance', 'trash', params],
        queryFn: () => apiClinicFinanceTransactionsRepository.listTrash(params),
    });
}

export function useFinanceSummary(params: FinanceListParams = {}) {
    return useQuery({
        queryKey: ['finance', 'summary', params],
        queryFn: () => apiClinicFinanceSummaryRepository.getSummary(params),
    });
}

export function useCreateFinanceTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: FinanceTransactionWriteDto) =>
            apiClinicFinanceTransactionsRepository.create(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Transação registrada.');
        },
    });
}

export function useUpdateFinanceTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            dto,
        }: {
            id: string;
            dto: FinanceTransactionWriteDto;
        }) => apiClinicFinanceTransactionsRepository.update(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Transação atualizada.');
        },
    });
}

export function useDeleteFinanceTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClinicFinanceTransactionsRepository.remove(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Transação excluída.');
        },
    });
}

export function useRestoreFinanceTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClinicFinanceTransactionsRepository.restore(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Transação restaurada.');
        },
    });
}

export function useUpdateOpeningBalance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: OpeningBalance) =>
            apiClinicFinanceOpeningBalanceRepository.upsert(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Saldo inicial atualizado.');
        },
    });
}
