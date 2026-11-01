import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { ApiErrorResponse } from '@/domain/api';
import type {
    FinanceListParams,
    FinanceTransactionWriteDto,
    FinancialSeriesKind,
    SeriesScope,
} from '@/domain/clinic/finance';
import {
    apiClinicFinanceSummaryRepository,
    apiClinicFinanceTransactionsRepository,
} from '@/infrastructure/repositories/api-clinic-finance-transactions';

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
        onSuccess: (_saved, dto) => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success(
                dto.repeat?.kind === 'installments'
                    ? `${dto.repeat.total} parcelas lançadas.`
                    : dto.repeat?.kind === 'recurrence'
                      ? 'Lançamento recorrente salvo. As próximas ocorrências já estão nos pendentes.'
                      : 'Lançamento salvo.',
            );
        },
    });
}

export function useUpdateFinanceTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            dto,
            scope,
        }: {
            id: string;
            dto: FinanceTransactionWriteDto;
            /** Só no lançamento de série. */
            scope?: SeriesScope;
        }) => apiClinicFinanceTransactionsRepository.update(id, dto, scope),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Lançamento atualizado.');
        },
    });
}

function deletedMessage(
    input: string | { scope?: SeriesScope; kind?: FinancialSeriesKind },
): string {
    if (typeof input === 'string' || input.scope !== 'following')
        return 'Lançamento enviado para a lixeira.';
    return input.kind === 'recurrence'
        ? 'Repetição encerrada. Esta e as próximas pendentes foram para a lixeira.'
        : 'Parcelas enviadas para a lixeira.';
}

export function useDeleteFinanceTransaction() {
    const qc = useQueryClient();
    return useMutation({
        /** O id, ou o id com o `scope` (e a espécie da série, para o aviso) no lançamento de série. */
        mutationFn: (
            input:
                | string
                | {
                      id: string;
                      scope?: SeriesScope;
                      kind?: FinancialSeriesKind;
                  },
        ) =>
            typeof input === 'string'
                ? apiClinicFinanceTransactionsRepository.remove(input)
                : apiClinicFinanceTransactionsRepository.remove(
                      input.id,
                      input.scope,
                  ),
        onSuccess: (_void, input) => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success(deletedMessage(input));
        },
    });
}

export function useRestoreFinanceTransaction() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            apiClinicFinanceTransactionsRepository.restore(id),
        // Invalida tudo de ['finance']: calendário, dia, pendências, resumo e relatório.
        onSuccess: (restored) => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            const day = restored.date.slice(0, 10).split('-').reverse();
            toast.success(
                `Lançamento restaurado. Ele voltou para ${day.join('/')}.`,
            );
        },
        onError: (err: ApiErrorResponse) => {
            toast.error(
                err?.response?.data?.message ??
                    'Não foi possível restaurar o lançamento.',
            );
        },
    });
}
