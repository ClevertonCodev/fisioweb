/** Agendamento - contexto clínica */
export type AppointmentStatus =
    | 'scheduled'
    | 'confirmed'
    | 'cancelled'
    | 'completed'
    | 'no_show';

export type AppointmentSource = 'system' | 'google';

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    clinicUserId: string;
    clinicUserName: string;
    title: string | null;
    description: string | null;
    startsAt: string;
    endsAt: string;
    status: AppointmentStatus;
    location: string | null;
    /** Origem do evento — `google` = importado do Google Calendar. */
    source: AppointmentSource;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    backgroundColor: string;
    borderColor: string;
    textColor: string;
    /** false para status terminais (não arrastar/redimensionar). */
    editable?: boolean;
    extendedProps: {
        appointment: Appointment;
        status: Appointment['status'];
    };
}

export const STATUS_COLORS: Record<
    AppointmentStatus,
    { bg: string; border: string; text: string; label: string }
> = {
    scheduled: {
        bg: '#3b82f6',
        border: '#2563eb',
        text: '#ffffff',
        label: 'Agendada',
    },
    confirmed: {
        bg: '#22c55e',
        border: '#16a34a',
        text: '#ffffff',
        label: 'Confirmada',
    },
    no_show: {
        bg: '#f59e0b',
        border: '#d97706',
        text: '#ffffff',
        label: 'Não compareceu',
    },
    completed: {
        bg: '#6b7280',
        border: '#4b5563',
        text: '#ffffff',
        label: 'Concluída',
    },
    cancelled: {
        bg: '#ef4444',
        border: '#dc2626',
        text: '#ffffff',
        label: 'Cancelada',
    },
};

const TERMINAL_STATUSES: AppointmentStatus[] = [
    'no_show',
    'completed',
    'cancelled',
];

/** Espelha a máquina de estados do backend (AppointmentStatus::canTransitionTo). */
export function canTransitionAppointmentStatus(
    from: AppointmentStatus,
    to: AppointmentStatus,
    startsAt: string | Date,
    now: Date = new Date(),
): boolean {
    if (from === to) return false;
    if (TERMINAL_STATUSES.includes(from)) return false;

    const start = startsAt instanceof Date ? startsAt : new Date(startsAt);
    const requiresStarted = to === 'no_show' || to === 'completed';
    if (requiresStarted && now < start) return false;

    if (from === 'scheduled') {
        return (
            to === 'confirmed' ||
            to === 'cancelled' ||
            to === 'no_show' ||
            to === 'completed'
        );
    }
    if (from === 'confirmed') {
        return to === 'cancelled' || to === 'no_show' || to === 'completed';
    }
    return false;
}

export function isTerminalAppointmentStatus(status: AppointmentStatus): boolean {
    return TERMINAL_STATUSES.includes(status);
}

const ALL_APPOINTMENT_STATUSES: AppointmentStatus[] = [
    'scheduled',
    'confirmed',
    'no_show',
    'completed',
    'cancelled',
];

/** Status exibíveis no select de edição (atual + transitáveis). */
export function selectableAppointmentStatuses(
    current: AppointmentStatus,
    startsAt: string | Date,
    now: Date = new Date(),
): AppointmentStatus[] {
    return ALL_APPOINTMENT_STATUSES.filter(
        (s) =>
            s === current ||
            canTransitionAppointmentStatus(current, s, startsAt, now),
    );
}
