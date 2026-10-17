import type { HTMLAttributes } from 'react';

import { dsCn } from '@/components/ds';
import type {
    Appointment,
    AppointmentStatus,
    CalendarEvent,
} from '@/domain/clinic';
import { STATUS_COLORS } from '@/domain/clinic';

import './agenda-prototype.css';

export interface AgendaClinicUser {
    id: string;
    name: string;
    photoUrl?: string;
}

/** Tudo que a AgendaPage já calcula; as variantes só trocam a renderização. */
export interface AgendaPrototypeProps {
    /** Consultas já filtradas por profissional e paciente. */
    appointments: Appointment[];
    /** Eventos v1 (cores hex do STATUS_COLORS) — usados só pelo Original. */
    events: CalendarEvent[];
    clinicUsers: AgendaClinicUser[];
    selectedUserId?: string;
    onUserChange: (id: string | undefined) => void;
    filteredPatientName?: string;
    calendarKey: string;
    calendarInitialDate?: Date;
    onEventClick: (appointment: Appointment) => void;
    onDateClick: (date: Date) => void;
    onEventDrop: (id: string, start: string, end: string) => Promise<void>;
    onEventResize: (id: string, start: string, end: string) => Promise<void>;
    onNewConsulta: () => void;
}

export const AGENDA_PROTOTYPE_VARIANTS = [
    { key: 'O', name: 'Original' },
    { key: 'A', name: 'Agenda DS, coluna flutuante' },
] as const;

export const STATUS_ORDER: AppointmentStatus[] = [
    'scheduled',
    'confirmed',
    'no_show',
    'completed',
    'cancelled',
];

/**
 * Status → aparência da consulta (fundo suave, faixa e texto), em tokens do
 * DS. As misturas com `color-mix` trocam sozinhas no tema escuro.
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

/** No protótipo, `no_show` se chama "Falta" (a v1 segue "Não compareceu"). */
const PROTOTYPE_LABELS: Partial<Record<AppointmentStatus, string>> = {
    no_show: 'Falta',
};

export function statusLabel(status: AppointmentStatus): string {
    return PROTOTYPE_LABELS[status] ?? STATUS_COLORS[status]?.label ?? status;
}

export function formatTime(iso: string | Date): string {
    return new Date(iso).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
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

export function AgendaShell({
    children,
    className,
    ...rest
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            {...rest}
            className={dsCn(
                'flex h-full flex-col bg-ds-surface-body font-ds text-ds-content-primary',
                className,
            )}
        >
            {children}
        </div>
    );
}
