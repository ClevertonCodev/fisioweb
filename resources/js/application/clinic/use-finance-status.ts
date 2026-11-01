import {
    useMutation,
    useMutationState,
    useQueryClient,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
    FinancialTransaction,
    FinancialTransactionStatus,
} from '@/domain/clinic/finance';
import { apiClinicFinanceTransactionsRepository } from '@/infrastructure/repositories/api-clinic-finance-transactions';

/** O status de "baixado" de cada tipo: entrada vira recebido, saída vira pago. */
export function settledStatus(
    type: FinancialTransaction['type'],
): FinancialTransactionStatus {
    return type === 'entrada' ? 'recebido' : 'pago';
}

const SETTLE_KEY = ['finance', 'transaction-status'] as const;

type StatusChange = { id: string; status: FinancialTransactionStatus };

/**
 * Baixa em um clique: marca a pendência como recebida/paga sem mudar data nem
 * forma de pagamento. O aviso traz "Desfazer", que volta para pendente pela
 * mesma rota. Invalida ['finance'] (pendências, calendário, resumo, relatório).
 *
 * Cada baixa trata a própria resposta (`mutateAsync().then`): no TanStack v5,
 * o `onSuccess` passado ao `mutate()` só roda no último, e a primeira de duas
 * baixas seguidas ficava sem aviso e sem Desfazer.
 */
export function useSettleFinanceTransaction() {
    const qc = useQueryClient();

    const mutation = useMutation({
        mutationKey: SETTLE_KEY,
        mutationFn: ({ id, status }: StatusChange) =>
            apiClinicFinanceTransactionsRepository.setStatus(id, status),
        onSettled: () => qc.invalidateQueries({ queryKey: ['finance'] }),
    });

    // Os ids com baixa (ou Desfazer) em andamento, todos, não só o último.
    const pendingIds = useMutationState({
        filters: { mutationKey: SETTLE_KEY, status: 'pending' },
        select: (m) => (m.state.variables as StatusChange | undefined)?.id,
    });

    function change(
        variables: StatusChange,
        onSuccess: () => void,
        onError: () => void,
    ) {
        mutation.mutateAsync(variables).then(onSuccess, onError);
    }

    function undo(t: FinancialTransaction) {
        change(
            { id: t.id, status: 'pendente' },
            () => toast.success(`"${t.description}" voltou para pendente.`),
            () =>
                toast.error(
                    `Não foi possível desfazer a baixa de "${t.description}".`,
                ),
        );
    }

    function settle(t: FinancialTransaction) {
        const status = settledStatus(t.type);
        const verb = status === 'recebido' ? 'recebido' : 'pago';
        change(
            { id: t.id, status },
            () =>
                toast.success(`"${t.description}" marcado como ${verb}.`, {
                    action: { label: 'Desfazer', onClick: () => undo(t) },
                }),
            () =>
                toast.error(
                    `Não foi possível dar baixa em "${t.description}".`,
                ),
        );
    }

    return {
        settle,
        isPending: pendingIds.length > 0,
        isSettling: (id: string) => pendingIds.includes(id),
    };
}
