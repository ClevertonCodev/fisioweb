import type { Appointment } from '@/domain/clinic';

import { whatsappPhoneDigits } from './whatsapp-phone';

function firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? '';
}

function scheduledText(appointment: Appointment): string {
    const start = new Date(appointment.startsAt);
    const day = start.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
    });
    const time = start.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const name = firstName(appointment.patientName);
    const professional = appointment.clinicUserName.trim();

    return [
        `Olá${name ? `, ${name}` : ''}!`,
        `Sua consulta está marcada para ${day} às ${time}${professional ? `, com ${professional}` : ''}.`,
    ].join('\n\n');
}

export function appointmentScheduledWhatsAppUrl(
    appointment: Appointment,
): string | null {
    const phone = whatsappPhoneDigits(appointment.patientPhone);
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(scheduledText(appointment))}`;
}
