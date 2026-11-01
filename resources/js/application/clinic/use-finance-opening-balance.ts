import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ApiErrorResponse } from '@/domain/api';
import type { OpeningBalance } from '@/domain/clinic/finance';
import { apiClinicFinanceOpeningBalanceRepository } from '@/infrastructure/repositories/api-clinic-finance-opening-balance';

function apiMessage(err: ApiErrorResponse, fallback: string): string {
    return err?.response?.data?.message ?? fallback;
}

/** Grava o saldo digitado do mês; resumo e relatório recarregam. */
export function useSaveOpeningBalance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: OpeningBalance) =>
            apiClinicFinanceOpeningBalanceRepository.save(payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Saldo inicial salvo.');
        },
        onError: (err: ApiErrorResponse) =>
            toast.error(
                apiMessage(err, 'Não foi possível salvar o saldo inicial.'),
            ),
    });
}

/** Apaga o digitado do mês (`YYYY-MM`) e volta ao calculado do mês anterior. */
export function useClearOpeningBalance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (period: string) =>
            apiClinicFinanceOpeningBalanceRepository.clear(period),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Saldo inicial voltou ao calculado.');
        },
        onError: (err: ApiErrorResponse) =>
            toast.error(
                apiMessage(err, 'Não foi possível voltar ao saldo calculado.'),
            ),
    });
}
