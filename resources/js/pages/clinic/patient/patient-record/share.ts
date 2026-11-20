/** Monta wa.me e o texto de copiar do questionário. */

export function phoneDigits(phone?: string | null): string {
    return (phone ?? '').replace(/\D/g, '');
}

export function whatsappChatUrl(phone?: string | null): string | null {
    const digits = phoneDigits(phone);
    return digits ? `https://wa.me/${digits}` : null;
}

export function buildWhatsAppUrl(
    phone: string | undefined,
    text: string,
): string | null {
    const digits = phoneDigits(phone);
    if (!digits) return null;
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function questionnaireShareText(
    patientName: string | undefined,
    title: string,
    shareUrl: string,
): string {
    return [
        `Olá${patientName ? `, ${patientName}` : ''}!`,
        `Seu questionário "${title}" já está disponível.`,
        shareUrl ? `Acesse: ${shareUrl}` : null,
    ]
        .filter(Boolean)
        .join('\n\n');
}
