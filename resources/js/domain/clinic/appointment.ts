/** Agendamento - contexto clínica */
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

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
    sendCalendarInvite: boolean;
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
    extendedProps: {
        appointment: Appointment;
        status: Appointment['status'];
    };
}

export const STATUS_COLORS: Record<
    AppointmentStatus,
    { bg: string; border: string; text: string; label: string }
> = {
    scheduled: { bg: '#3b82f6', border: '#2563eb', text: '#ffffff', label: 'Agendada' },
    confirmed: { bg: '#22c55e', border: '#16a34a', text: '#ffffff', label: 'Confirmada' },
    no_show: { bg: '#f59e0b', border: '#d97706', text: '#ffffff', label: 'Não compareceu' },
    completed: { bg: '#6b7280', border: '#4b5563', text: '#ffffff', label: 'Concluída' },
    cancelled: { bg: '#ef4444', border: '#dc2626', text: '#ffffff', label: 'Cancelada' },
};
