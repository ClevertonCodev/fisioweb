import { FINANCE_ATTACHMENT_LIMITS } from '@/domain/clinic/finance-attachment';

const { maxFiles, maxBytes, extensions } = FINANCE_ATTACHMENT_LIMITS;

/** O que o `<input type="file">` aceita: as extensões e os tipos de foto/PDF. */
export const ATTACHMENT_ACCEPT = [
    ...extensions.map((ext) => `.${ext}`),
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/pdf',
].join(',');

const extensionOf = (name: string) =>
    name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';

/**
 * Confere antes de enviar o que o backend vai conferir de novo: tipo (pela
 * extensão, porque o HEIC do iPhone costuma chegar sem `type`), 10 MB e o
 * limite de 5 por lançamento. Passar do limite não envia nenhum, para a
 * pessoa escolher quais ficam.
 */
export function checkAttachmentFiles(
    files: File[],
    existingCount: number,
): { accepted: File[]; errors: string[] } {
    const room = Math.max(0, maxFiles - existingCount);
    if (room === 0)
        return {
            accepted: [],
            errors: [
                `Este lançamento já tem ${maxFiles} comprovantes, o limite. Remova um para enviar outro.`,
            ],
        };

    const errors: string[] = [];
    const accepted = files.filter((file) => {
        if (
            !(extensions as readonly string[]).includes(extensionOf(file.name))
        ) {
            errors.push(`“${file.name}” não é JPG, PNG, WEBP, HEIC ou PDF.`);
            return false;
        }
        if (file.size > maxBytes) {
            errors.push(`“${file.name}” passa de 10 MB.`);
            return false;
        }
        return true;
    });

    if (accepted.length > room)
        return {
            accepted: [],
            errors: [
                ...errors,
                `Cada lançamento aceita até ${maxFiles} comprovantes. Dá para enviar só mais ${room}.`,
            ],
        };

    return { accepted, errors };
}

/** "820 KB", "2,4 MB". */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024)
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
}
