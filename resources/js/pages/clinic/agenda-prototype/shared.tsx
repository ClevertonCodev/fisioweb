import type { HTMLAttributes } from 'react';

import type { BadgeVariant } from '@/components/ds';
import { dsCn } from '@/components/ds';
import type {
    Appointment,
    AppointmentStatus,
    CalendarEvent,
} from '@/domain/clinic';
import { isTerminalAppointmentStatus, STATUS_COLORS } from '@/domain/clinic';

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
    { key: 'A', name: 'Mesma agenda, pele DS' },
    { key: 'B', name: 'Barra própria + trilho do dia' },
    { key: 'C', name: 'Dia por profissional' },
    { key: 'D', name: 'Agenda ampla (referência)' },
] as const;

export const STATUS_ORDER: AppointmentStatus[] = [
    'scheduled',
    'confirmed',
    'no_show',
    'completed',
    'cancelled',
];

/**
 * Status → tokens semânticos do DS. Valores em `var(--ds-*)` para o
 * FullCalendar (estilo inline) e classes para o JSX; os dois trocam sozinhos
 * no tema escuro.
 */
export const DS_STATUS: Record<
    AppointmentStatus,
    {
        surface: string;
        accent: string;
        content: string;
        dotClass: string;
        surfaceClass: string;
        contentClass: string;
        badge: BadgeVariant;
    }
> = {
    scheduled: {
        surface: 'var(--ds-status-info-surface)',
        accent: 'var(--ds-status-info-content)',
        content: 'var(--ds-status-info-content)',
        dotClass: 'bg-ds-status-info-content',
        surfaceClass: 'bg-ds-status-info-surface',
        contentClass: 'text-ds-status-info-content',
        badge: 'info',
    },
    confirmed: {
        surface: 'var(--ds-status-success-surface)',
        accent: 'var(--ds-status-success-content)',
        content: 'var(--ds-status-success-content)',
        dotClass: 'bg-ds-status-success-content',
        surfaceClass: 'bg-ds-status-success-surface',
        contentClass: 'text-ds-status-success-content',
        badge: 'success',
    },
    // Falta: vermelho forte (fundo mais cheio, faixa e texto escuros).
    no_show: {
        surface:
            'color-mix(in srgb, var(--ds-color-danger-100) 20%, transparent)',
        accent: 'var(--ds-color-danger-100)',
        content:
            'color-mix(in srgb, var(--ds-color-danger-100) 75%, var(--ds-content-primary))',
        dotClass: 'bg-ds-danger-100',
        surfaceClass: 'bg-ds-status-danger-surface',
        contentClass: 'text-ds-danger-100',
        badge: 'danger',
    },
    // Concluída: lilás (chart-c2), fora da família dos outros status.
    completed: {
        surface: 'color-mix(in srgb, var(--ds-chart-c2) 14%, transparent)',
        accent: 'var(--ds-chart-c2)',
        content:
            'color-mix(in srgb, var(--ds-chart-c2) 65%, var(--ds-content-primary))',
        dotClass: 'bg-[var(--ds-chart-c2)]',
        surfaceClass:
            'bg-[color-mix(in_srgb,var(--ds-chart-c2)_14%,transparent)]',
        contentClass: 'text-[var(--ds-chart-c2)]',
        badge: 'primary',
    },
    // Cancelada: vermelho fraco (fundo quase neutro, faixa clara, texto apagado).
    cancelled: {
        surface:
            'color-mix(in srgb, var(--ds-color-danger-50) 8%, transparent)',
        accent: 'var(--ds-color-danger-50)',
        content:
            'color-mix(in srgb, var(--ds-color-danger-80) 55%, var(--ds-content-secondary))',
        dotClass: 'bg-ds-danger-50',
        surfaceClass: 'bg-ds-status-danger-surface',
        contentClass: 'text-ds-content-muted',
        badge: 'default',
    },
};

/** No protótipo, `no_show` se chama "Falta" (a v1 segue "Não compareceu"). */
const PROTOTYPE_LABELS: Partial<Record<AppointmentStatus, string>> = {
    no_show: 'Falta',
};

export function statusLabel(status: AppointmentStatus): string {
    return PROTOTYPE_LABELS[status] ?? STATUS_COLORS[status]?.label ?? status;
}

export function toDsCalendarEvent(apt: Appointment): CalendarEvent {
    const tone = DS_STATUS[apt.status];
    return {
        id: apt.id,
        title: apt.title ?? apt.patientName,
        start: apt.startsAt,
        end: apt.endsAt,
        allDay: false,
        backgroundColor: tone.surface,
        borderColor: tone.accent,
        textColor: tone.content,
        editable: !isTerminalAppointmentStatus(apt.status),
        extendedProps: { appointment: apt, status: apt.status },
    };
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

export function startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

/** Segunda-feira da semana de `date`. */
export function startOfWeek(date: Date): Date {
    const d = startOfDay(date);
    const offset = (d.getDay() + 6) % 7;
    return addDays(d, -offset);
}

export function appointmentsOn(
    appointments: Appointment[],
    day: Date,
): Appointment[] {
    return appointments
        .filter((a) => isSameDay(new Date(a.startsAt), day))
        .sort(
            (a, b) =>
                new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        );
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

export function InitialsAvatar({
    name,
    src,
    size = 'md',
}: {
    name: string;
    src?: string;
    size?: 'sm' | 'md';
}) {
    return (
        <span
            className={dsCn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-surface-brand-subtle font-semibold text-ds-content-brand',
                size === 'sm' ? 'size-6 text-[10px]' : 'size-8 text-ds-caption',
            )}
        >
            {src ? (
                <img src={src} alt="" className="size-full object-cover" />
            ) : (
                initials(name)
            )}
        </span>
    );
}

export function StatusLegend({
    hidden,
    onToggle,
    className,
}: {
    hidden?: Set<AppointmentStatus>;
    onToggle?: (status: AppointmentStatus) => void;
    className?: string;
}) {
    return (
        <div className={dsCn('flex flex-wrap gap-2', className)}>
            {STATUS_ORDER.map((status) => {
                const off = hidden?.has(status) ?? false;
                const tone = DS_STATUS[status];
                const content = (
                    <>
                        <span
                            className={dsCn(
                                'size-2 shrink-0 rounded-ds-full',
                                tone.dotClass,
                            )}
                        />
                        {statusLabel(status)}
                    </>
                );
                if (!onToggle) {
                    return (
                        <span
                            key={status}
                            className="flex items-center gap-2 text-ds-body-xs text-ds-content-secondary"
                        >
                            {content}
                        </span>
                    );
                }
                return (
                    <button
                        key={status}
                        type="button"
                        aria-pressed={!off}
                        onClick={() => onToggle(status)}
                        className={dsCn(
                            'flex cursor-pointer items-center gap-2 rounded-ds-pill border px-3 py-1 text-ds-body-xs transition-colors',
                            off
                                ? 'border-ds-border-default text-ds-content-subtle line-through'
                                : 'border-ds-border-default bg-ds-surface-default text-ds-content-secondary hover:border-ds-border-strong',
                        )}
                    >
                        {content}
                    </button>
                );
            })}
        </div>
    );
}
