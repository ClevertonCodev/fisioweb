import type { AppointmentStatus } from '@/domain/clinic';

export interface AgendaClinicUser {
    id: string;
    name: string;
    photoUrl?: string;
}

export const STATUS_ORDER: AppointmentStatus[] = [
    'scheduled',
    'confirmed',
    'no_show',
    'completed',
    'cancelled',
];

/**
 * Status → aparência da consulta na agenda v2 (fundo suave, faixa e texto), em
 * tokens do DS. As misturas com `color-mix` trocam sozinhas no tema escuro.
 * A v1 continua com o `STATUS_COLORS` do domain.
 */
export const DS_STATUS: Record<
    AppointmentStatus,
    { surface: string; accent: string; content: string }
> = {
    scheduled: {
        surface: 'var(--ds-status-info-surface)',
        accent: 'var(--ds-status-info-content)',
        content: 'var(--ds-status-info-content)',
    },
    confirmed: {
        surface: 'var(--ds-status-success-surface)',
        accent: 'var(--ds-status-success-content)',
        content: 'var(--ds-status-success-content)',
    },
    // Falta: vermelho forte.
    no_show: {
        surface:
            'color-mix(in srgb, var(--ds-color-danger-100) 20%, transparent)',
        accent: 'var(--ds-color-danger-100)',
        content:
            'color-mix(in srgb, var(--ds-color-danger-100) 75%, var(--ds-content-primary))',
    },
    // Concluída: lilás (chart-c2).
    completed: {
        surface: 'color-mix(in srgb, var(--ds-chart-c2) 14%, transparent)',
        accent: 'var(--ds-chart-c2)',
        content:
            'color-mix(in srgb, var(--ds-chart-c2) 65%, var(--ds-content-primary))',
    },
    // Cancelada: vermelho fraco.
    cancelled: {
        surface:
            'color-mix(in srgb, var(--ds-color-danger-50) 8%, transparent)',
        accent: 'var(--ds-color-danger-50)',
        content:
            'color-mix(in srgb, var(--ds-color-danger-80) 55%, var(--ds-content-secondary))',
    },
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
    scheduled: 'Agendada',
    confirmed: 'Confirmada',
    no_show: 'Falta',
    completed: 'Concluída',
    cancelled: 'Cancelada',
};

export function statusLabel(status: AppointmentStatus): string {
    return STATUS_LABELS[status] ?? status;
}

export function formatTime(iso: string | Date): string {
    return new Date(iso).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** "10:00 – 11:00", ou com o dia do término quando ele é outro. */
export function formatTimeRange(startsAt: string, endsAt: string): string {
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const endText = isSameDay(start, end)
        ? formatTime(end)
        : `${formatTime(end)} de ${end.toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: '2-digit',
              month: '2-digit',
          })}`;
    return `${formatTime(start)} – ${endText}`;
}

/** "45 min", "1 h 30 min" ou "1 d 8 h 30 min". */
export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const rest = minutes % 60;
    const parts = [
        days > 0 ? `${days} d` : '',
        hours > 0 ? `${hours} h` : '',
        rest > 0 ? `${rest} min` : '',
    ];
    return parts.filter(Boolean).join(' ');
}

export function capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function monthTitle(date: Date): string {
    return capitalize(
        date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    );
}

export function formatLongDate(date: Date | null): string {
    if (!date) return '';
    return capitalize(
        date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        }),
    );
}

/** Data longa com o ano quando ele não é o atual (histórico atravessa anos). */
export function formatHistoryDate(date: Date, now: Date = new Date()): string {
    const base = formatLongDate(date);
    return date.getFullYear() === now.getFullYear()
        ? base
        : `${base} de ${date.getFullYear()}`;
}

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

/** Segunda-feira da semana de `date`. */
export function startOfWeek(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return addDays(d, -((d.getDay() + 6) % 7));
}
