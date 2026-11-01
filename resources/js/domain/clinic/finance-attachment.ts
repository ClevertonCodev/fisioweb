/** Comprovante de um lançamento de Finanças. Só abre por link assinado. */
export interface FinanceAttachment {
    id: string;
    transactionId: string;
    originalName: string;
    mimeType: string;
    size: number;
    createdAt?: string;
}

/** Link assinado de poucos minutos para abrir o comprovante. */
export interface FinanceAttachmentLink {
    url: string;
    expiresAt: string;
}

/** As mesmas regras do backend (que é quem vale): 5 por lançamento, 10 MB, foto ou PDF. */
export const FINANCE_ATTACHMENT_LIMITS = {
    maxFiles: 5,
    maxBytes: 10 * 1024 * 1024,
    extensions: ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf'],
} as const;
