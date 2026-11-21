import type { Appointment, AppointmentNoticeKind } from '@/domain/clinic';

import { whatsappPhoneDigits } from './whatsapp-phone';

function firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? '';
}

function noticeText(
    appointment: Appointment,
    kind: AppointmentNoticeKind,
): string {
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
    const withProfessional = professional ? `, com ${professional}` : '';
    const when = `${day} às ${time}${withProfessional}`;

    const body = {
        scheduled: [`Sua consulta está marcada para ${when}.`],
        rescheduled: [`Sua consulta foi remarcada para ${when}.`],
        cancelled: [
            `Sua consulta de ${when}${withProfessional ? ',' : ''} foi cancelada.`,
            'Para marcar um novo horário, fale com a clínica.',
        ],
    }[kind];

    return [`Olá${name ? `, ${name}` : ''}!`, ...body].join('\n\n');
}

export function appointmentWhatsAppUrl(
    appointment: Appointment,
    kind: AppointmentNoticeKind,
): string | null {
    const phone = whatsappPhoneDigits(appointment.patientPhone);
    if (!phone) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(noticeText(appointment, kind))}`;
}
