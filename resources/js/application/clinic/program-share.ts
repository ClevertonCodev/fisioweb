import type { Program } from '@/domain/clinic';

function shareText(program: Program): string {
    const message = program.message?.trim();
    const link = program.shareUrl ?? '';
    return [
        `Olá${program.patientName ? `, ${program.patientName}` : ''}!`,
        `Seu programa de tratamento "${program.title}" já está disponível.`,
        message || null,
        link ? `Acesse: ${link}` : null,
    ]
        .filter(Boolean)
        .join('\n\n');
}

export function programWhatsAppUrl(program: Program): string | null {
    const phone = (program.patientPhone ?? '').replace(/\D/g, '');
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(shareText(program))}`;
}

export function programMailtoUrl(program: Program): string | null {
    const email = program.patientEmail?.trim();
    if (!email) return null;
    const subject = `Programa de tratamento: ${program.title}`;
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareText(program))}`;
}
