import { Plus } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAgendaPatients, useAppointments, useClinicUsers } from '@/application/clinic';
import { AppointmentModal } from '@/components/clinic/agenda/AppointmentModal';
import { CalendarSidebar } from '@/components/clinic/agenda/CalendarSidebar';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Appointment, CalendarEvent } from '@/domain/clinic';
import { STATUS_COLORS } from '@/domain/clinic';

const CalendarView = lazy(() =>
    import('@/components/clinic/agenda/CalendarView').then((m) => ({ default: m.CalendarView })),
);

function toCalendarEvent(apt: Appointment): CalendarEvent {
    const colors = STATUS_COLORS[apt.status];
    return {
        id: apt.id,
        title: apt.title ?? `Consulta - ${apt.patientName}`,
        start: apt.startsAt,
        end: apt.endsAt,
        allDay: false,
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
        extendedProps: { appointment: apt, status: apt.status },
    };
}

export default function AgendaPage() {
    const { data: appointmentsData = [] } = useAppointments();
    const { data: clinicUsers = [] } = useClinicUsers();
    const { data: agendaPatients = [] } = useAgendaPatients();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    useEffect(() => {
        if (appointmentsData.length > 0) setAppointments(appointmentsData);
    }, [appointmentsData]);

    const filteredAppointments = useMemo(() => {
        if (!selectedUserId) return appointments;
        return appointments.filter((a) => a.clinicUserId === selectedUserId);
    }, [appointments, selectedUserId]);

    const events = useMemo(() => filteredAppointments.map(toCalendarEvent), [filteredAppointments]);

    const handleEventClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setSelectedDate(null);
        setModalOpen(true);
    };

    const handleDateClick = (date: Date) => {
        setSelectedDate(date);
        setSelectedAppointment(null);
        setModalOpen(true);
    };

    const handleNewConsulta = () => {
        setSelectedAppointment(null);
        setSelectedDate(new Date());
        setModalOpen(true);
    };

    const handleSave = (data: Partial<Appointment>) => {
        if (data.id) {
            setAppointments((prev) =>
                prev.map((a) => (a.id === data.id ? ({ ...a, ...data } as Appointment) : a)),
            );
        } else {
            const newApt: Appointment = {
                ...data,
                id: String(Date.now()),
            } as Appointment;
            setAppointments((prev) => [...prev, newApt]);
        }
    };

    const handleEventDrop = (id: string, start: string, end: string) => {
        setAppointments((prev) =>
            prev.map((a) =>
                a.id === id
                    ? {
                          ...a,
                          startsAt: new Date(start).toISOString(),
                          endsAt: new Date(end).toISOString(),
                      }
                    : a,
            ),
        );
        toast.success('Consulta reposicionada.');
    };

    const handleEventResize = (id: string, start: string, end: string) => {
        setAppointments((prev) =>
            prev.map((a) =>
                a.id === id
                    ? {
                          ...a,
                          startsAt: new Date(start).toISOString(),
                          endsAt: new Date(end).toISOString(),
                      }
                    : a,
            ),
        );
        toast.success('Duração da consulta alterada.');
    };

    return (
        <ClinicLayout>
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="border-border flex items-center justify-between border-b px-6 py-4">
                    <h1 className="text-foreground text-xl font-semibold">Agenda</h1>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button onClick={handleNewConsulta}>
                                <Plus className="h-4 w-4" />
                                Nova Consulta
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Agendar nova consulta</TooltipContent>
                    </Tooltip>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                    <CalendarSidebar
                        clinicUsers={clinicUsers}
                        selectedUserId={selectedUserId}
                        onUserChange={setSelectedUserId}
                    />
                    <div className="flex-1 overflow-auto p-4">
                        <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-lg" />}>
                            <CalendarView
                                events={events}
                                onEventClick={handleEventClick}
                                onDateClick={handleDateClick}
                                onEventDrop={handleEventDrop}
                                onEventResize={handleEventResize}
                            />
                        </Suspense>
                    </div>
                </div>
            </div>

            <AppointmentModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                appointment={selectedAppointment}
                initialDate={selectedDate}
                patients={agendaPatients}
                clinicUsers={clinicUsers}
                onSave={handleSave}
            />
        </ClinicLayout>
    );
}
