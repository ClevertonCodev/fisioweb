import type { BadgeVariant } from '@/components/ds';
import {
    STATUS_COLORS,
    type AppointmentStatus,
} from '@/domain/clinic/appointment';
import type {
    Birthday,
    DashboardUpcomingAppointment,
    OccupancyGranularity,
} from '@/domain/clinic/dashboard';

const SOURCE_LABELS: Record<string, string> = {
    indicacao_medica: 'Indicação médica',
    indicacao_amigo: 'Indicação de amigo',
    redes_sociais: 'Redes sociais',
    google: 'Google',
    convenio: 'Convênio',
};

export const OCCUPANCY_GRANULARITIES: {
    value: OccupancyGranularity;
    label: string;
}[] = [
    { value: 'daily', label: 'Diária' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' },
];

/** Dia local (aaaa-mm-dd): o summary do backend vale para "hoje" e "este mês". */
export function dayKey(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function monthName(date: Date): string {
    return date.toLocaleDateString('pt-BR', { month: 'long' });
}

export function initials(name: string): string {
    return (
        name
            .split(' ')
            .map((part) => part[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || '?'
    );
}

const NAME_TITLE = /^(dra?|prof|profa|sr|sra)\.?$/i;

export function firstName(name: string): string {
    return name.split(' ').find((part) => part && !NAME_TITLE.test(part)) ?? '';
}

export function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

// O payload não traz o fim da sessão: até 60 min do início ela conta como em andamento.
const IN_PROGRESS_WINDOW_MS = 60 * 60 * 1000;
const PENDING_STATUSES: string[] = ['scheduled', 'confirmed'];

export function pickNextSession(
    appointments: DashboardUpcomingAppointment[],
    now: Date,
): DashboardUpcomingAppointment | undefined {
    const cutoff = now.getTime() - IN_PROGRESS_WINDOW_MS;
    return appointments.find(
        (item) =>
            PENDING_STATUSES.includes(item.status) &&
            new Date(item.startsAt).getTime() > cutoff,
    );
}

export function nextSessionTimingLabel(startsAt: string, now: Date): string {
    const time = formatTime(startsAt);
    if (new Date(startsAt).getTime() <= now.getTime()) {
        return `Agora · ${time}`;
    }
    return time;
}

export function formatToday(now: Date): string {
    const raw = now.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function statusLabel(status: string): string {
    return STATUS_COLORS[status as AppointmentStatus]?.label ?? status;
}

export function statusBadgeVariant(status: string): BadgeVariant {
    switch (status as AppointmentStatus) {
        case 'scheduled':
            return 'info';
        case 'confirmed':
            return 'success';
        case 'no_show':
            return 'warning';
        case 'cancelled':
            return 'danger';
        default:
            return 'default';
    }
}

export function sourceLabel(source: string): string {
    return SOURCE_LABELS[source] ?? source;
}

export function relativeTime(iso: string): string {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'agora mesmo';
    if (minutes < 60) return `${minutes} min atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
}

export function whatsappUrl(birthday: Birthday): string {
    const digits = (birthday.phone ?? '').replace(/\D/g, '');
    const message = `Olá, ${birthday.name}! A equipe da clínica deseja um feliz aniversário!`;
    return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
