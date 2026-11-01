import type {
    FinanceAttachment,
    FinanceAttachmentLink,
} from '@/domain/clinic/finance-attachment';
import { apiClient } from '@/infrastructure/api/client';

interface ApiAttachment {
    id: number;
    financial_transaction_id: number;
    original_name: string;
    mime_type: string;
    size: number;
    created_at?: string;
}

const base = (transactionId: string) =>
    `/clinic/finances/transactions/${transactionId}/attachments`;

function mapAttachment(raw: ApiAttachment): FinanceAttachment {
    return {
        id: String(raw.id),
        transactionId: String(raw.financial_transaction_id),
        originalName: raw.original_name,
        mimeType: raw.mime_type,
        size: Number(raw.size),
        createdAt: raw.created_at,
    };
}

/** Comprovantes de um lançamento (`files[]` multipart; abrir por link assinado). */
export const apiClinicFinanceAttachmentsRepository = {
    async list(transactionId: string): Promise<FinanceAttachment[]> {
        const { data } = await apiClient.get<{ data: ApiAttachment[] }>(
            base(transactionId),
        );
        return data.data.map(mapAttachment);
    },

    async upload(
        transactionId: string,
        files: File[],
    ): Promise<FinanceAttachment[]> {
        const body = new FormData();
        files.forEach((file) => body.append('files[]', file));
        const { data } = await apiClient.post<{ data: ApiAttachment[] }>(
            base(transactionId),
            body,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return data.data.map(mapAttachment);
    },

    async signedUrl(
        transactionId: string,
        attachmentId: string,
    ): Promise<FinanceAttachmentLink> {
        const { data } = await apiClient.get<{
            data: { url: string; expires_at: string };
        }>(`${base(transactionId)}/${attachmentId}/url`);
        return { url: data.data.url, expiresAt: data.data.expires_at };
    },

    async remove(transactionId: string, attachmentId: string): Promise<void> {
        await apiClient.delete(`${base(transactionId)}/${attachmentId}`);
    },
};
