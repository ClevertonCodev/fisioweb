import { Plus } from 'lucide-react';
import { lazy, Suspense, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import type { AppointmentWriteDto } from '@/application/clinic';
import {
    useAgendaPatients,
    useAppointments,
    useCancelAppointment,
    useClinicUsers,
    useCreateAppointment,
    useUpdateAppointment,
    useUpdateAppointmentStatus,
} from '@/application/clinic';
import { AppointmentModal } from '@/components/clinic/agenda/AppointmentModal';
import { CalendarSidebar } from '@/components/clinic/agenda/CalendarSidebar';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import type {
    Appointment,
    AppointmentStatus,
    CalendarEvent,
} from '@/domain/clinic';
import { STATUS_COLORS } from '@/domain/clinic';

const CalendarView = lazy(() =>
    import('@/components/clinic/agenda/CalendarView').then((m) => ({
        default: m.CalendarView,
    })),
);

/** Referência estável para evitar novo array a cada render (loop de re-render). */
const EMPTY_APPOINTMENTS: Appointment[] = [];

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
    const { user } = useAuth();
    const lockedClinicUserId =
        user?.role === 'physiotherapist' ? String(user.id) : undefined;
    const { data: appointmentsData = EMPTY_APPOINTMENTS } = useAppointments();
    const { data: clinicUsers = [] } = useClinicUsers();
    const { data: agendaPatients = [] } = useAgendaPatients();
    const createMutation = useCreateAppointment();
    const updateMutation = useUpdateAppointment();
    const statusMutation = useUpdateAppointmentStatus();
    const cancelMutation = useCancelAppointment();
    const [appointments, setAppointments] =
        useState<Appointment[]>(appointmentsData);
    const [syncedData, setSyncedData] = useState(appointmentsData);
    const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [navHandled, setNavHandled] = useState(false);
    const location = useLocation();

    // Deep-link da ação rápida "Agendar consulta": abre o modal "Nova consulta"
    // ao chegar com o sinal de navegação (FR-026). Ajuste de estado durante o
    // render (mesmo padrão de syncedData), guardado para rodar só uma vez.
    const openNewAppointment = (
        location.state as { openNewAppointment?: boolean } | null
    )?.openNewAppointment;
    if (openNewAppointment && !navHandled) {
        setNavHandled(true);
        setSelectedAppointment(null);
        setSelectedDate(new Date());
        setModalOpen(true);
    }

    // Sincroniza o estado local quando os dados do servidor mudam (padrão React:
    // ajuste de estado durante o render, sem setState em useEffect).
    if (appointmentsData !== syncedData) {
        setSyncedData(appointmentsData);
        setAppointments(appointmentsData);
    }

    const filteredAppointments = useMemo(() => {
        if (!selectedUserId) return appointments;
        return appointments.filter((a) => a.clinicUserId === selectedUserId);
    }, [appointments, selectedUserId]);

    const events = useMemo(
        () => filteredAppointments.map(toCalendarEvent),
        [filteredAppointments],
    );

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

    const handleSubmit = async (dto: AppointmentWriteDto) => {
        if (selectedAppointment) {
            try {
                await updateMutation.mutateAsync({
                    id: selectedAppointment.id,
                    dto,
                });
                toast.success('Consulta atualizada.');
                setModalOpen(false);
            } catch {
                toast.error('Não foi possível atualizar a consulta.');
            }
            return;
        }

        try {
            await createMutation.mutateAsync(dto);
            toast.success('Consulta agendada com sucesso!');
            setModalOpen(false);
        } catch {
            toast.error('Não foi possível agendar a consulta.');
        }
    };

    const handleStatusChange = async (status: AppointmentStatus) => {
        if (!selectedAppointment) return;
        try {
            const updated = await statusMutation.mutateAsync({
                id: selectedAppointment.id,
                status,
            });
            setSelectedAppointment(updated);
            toast.success('Status atualizado.');
        } catch {
            toast.error('Não foi possível alterar o status.');
        }
    };

    const handleCancelAppointment = async () => {
        if (!selectedAppointment) return;
        try {
            const updated = await cancelMutation.mutateAsync(
                selectedAppointment.id,
            );
            setSelectedAppointment(updated);
            toast.success('Consulta cancelada.');
        } catch {
            toast.error('Não foi possível cancelar a consulta.');
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
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h1 className="text-xl font-semibold text-foreground">
                        Agenda
                    </h1>
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
                        <Suspense
                            fallback={
                                <Skeleton className="h-[600px] w-full rounded-lg" />
                            }
                        >
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
                onSubmit={handleSubmit}
                isSubmitting={
                    createMutation.isPending || updateMutation.isPending
                }
                lockedClinicUserId={lockedClinicUserId}
                onStatusChange={handleStatusChange}
                onCancelAppointment={handleCancelAppointment}
                isMutatingStatus={
                    statusMutation.isPending || cancelMutation.isPending
                }
            />
        </ClinicLayout>
    );
}
