import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getValidationErrors } from '@/application/clinic/validation-errors';
import type { ApiErrorResponse } from '@/domain/api';
import { apiClinicFinanceAttachmentsRepository } from '@/infrastructure/repositories/api-clinic-finance-attachments';

export const financeAttachmentsKey = (transactionId: string) =>
    ['finance', 'attachments', transactionId] as const;

/** Mensagens do 422 (`files`, `files.0`...) numa lista; vazia quando não é 422. */
export function attachmentErrorsOf(error: unknown): string[] {
    const validation = getValidationErrors(error);
    if (!validation) return [];
    const messages = Object.values(validation.fields).flat();
    return messages.length > 0
        ? messages
        : validation.message
          ? [validation.message]
          : [];
}

/** Comprovantes do lançamento (o lançamento na lixeira responde 404). */
export function useFinanceAttachments(transactionId: string) {
    return useQuery({
        queryKey: financeAttachmentsKey(transactionId),
        queryFn: () =>
            apiClinicFinanceAttachmentsRepository.list(transactionId),
    });
}

/** Envia os arquivos; a lista e o `attachmentsCount` das listagens recarregam. */
export function useUploadFinanceAttachments(transactionId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (files: File[]) =>
            apiClinicFinanceAttachmentsRepository.upload(transactionId, files),
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success(
                created.length === 1
                    ? 'Comprovante enviado.'
                    : `${created.length} comprovantes enviados.`,
            );
        },
        onError: (err: ApiErrorResponse) => {
            // O 422 aparece na área de comprovantes; aqui só o que não é validação.
            if (getValidationErrors(err)) return;
            toast.error(
                err?.response?.data?.message ??
                    'Não foi possível enviar o comprovante. Tente de novo.',
            );
        },
    });
}

export function useDeleteFinanceAttachment(transactionId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (attachmentId: string) =>
            apiClinicFinanceAttachmentsRepository.remove(
                transactionId,
                attachmentId,
            ),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Comprovante removido.');
        },
        onError: () =>
            toast.error(
                'Não foi possível remover o comprovante. Tente de novo.',
            ),
    });
}

/**
 * Abre o comprovante numa aba nova pelo link assinado. A aba abre antes do
 * pedido (no clique), senão o navegador do celular bloqueia como pop-up.
 */
export function useOpenFinanceAttachment(transactionId: string) {
    return useMutation({
        mutationFn: async (attachmentId: string) => {
            const tab = window.open('', '_blank');
            try {
                const link =
                    await apiClinicFinanceAttachmentsRepository.signedUrl(
                        transactionId,
                        attachmentId,
                    );
                if (tab) {
                    tab.opener = null;
                    tab.location.href = link.url;
                } else window.location.assign(link.url);
                return link;
            } catch (error) {
                tab?.close();
                throw error;
            }
        },
        onError: () =>
            toast.error('Não foi possível abrir o comprovante. Tente de novo.'),
    });
}
