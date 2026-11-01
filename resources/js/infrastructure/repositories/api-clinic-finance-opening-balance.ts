import type { OpeningBalance } from '@/domain/clinic/finance';
import { apiClient } from '@/infrastructure/api/client';

/** Saldo inicial digitado do mês (só o administrador grava ou apaga). */
export const apiClinicFinanceOpeningBalanceRepository = {
    async save(payload: OpeningBalance): Promise<OpeningBalance> {
        const { data } = await apiClient.put<{ data: Record<string, unknown> }>(
            '/clinic/finances/opening-balance',
            {
                year: payload.year,
                month: payload.month,
                amount: payload.amount,
            },
        );
        return {
            year: Number(data.data.year),
            month: Number(data.data.month),
            amount: Number(data.data.amount),
        };
    },

    /** Apaga o digitado do mês (`YYYY-MM`); ele volta ao calculado. */
    async clear(period: string): Promise<void> {
        await apiClient.delete('/clinic/finances/opening-balance', {
            params: { period },
        });
    },
};
