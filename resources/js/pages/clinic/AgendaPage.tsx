import { useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import type { AppointmentWriteDto } from '@/application/clinic';
import {
    useAgendaPatients,
    useAgendaPreferences,
    useAppointments,
    useCancelAppointment,
    useClinicUsers,
    useCreateAppointment,
    useReplaceServiceTypes,
    useSaveAgendaPreference,
    useServiceTypes,
    useUpdateAppointment,
    useUpdateAppointmentStatus,
} from '@/application/clinic';
import { can } from '@/application/clinic/permissions';
import { AgendaView } from '@/components/clinic/agenda/AgendaView';
import { AppointmentModal } from '@/components/clinic/agenda/appointment-modal/AppointmentModal';
import { ClinicLayout } from '@/components/clinic/ClinicLayout';
import { useAuth } from '@/contexts/AuthContext';
import type {
    AgendaView as AgendaViewId,
    Appointment,
    AppointmentStatus,
    ServiceType,
    ServiceTypeDraft,
} from '@/domain/clinic';
import {
    DEFAULT_AGENDA_PREFERENCES,
    isTerminalAppointmentStatus,
} from '@/domain/clinic';

/** Referências estáveis para evitar novo array a cada render (loop de re-render). */
const EMPTY_APPOINTMENTS: Appointment[] = [];
const EMPTY_SERVICE_TYPES: ServiceType[] = [];

function appointmentToWriteDto(
    apt: Appointment,
    startsAt: string,
    endsAt: string,
): AppointmentWriteDto {
    return {
        patientId: apt.source === 'google' ? null : apt.patientId,
        clinicUserId: apt.clinicUserId,
        title: apt.title,
        description: apt.description,
        location: apt.location,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
    };
}

function apiErrorMessage(error: unknown, fallback: string): string {
    if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
    ) {
        return error.response.data.message;
    }
    return fallback;
}

export default function AgendaPage() {
    const { user } = useAuth();
    const isPhysio = user?.role === 'physiotherapist';
    const lockedClinicUserId = isPhysio ? String(user.id) : undefined;
    const { data: appointmentsData = EMPTY_APPOINTMENTS } = useAppointments();
    const { data: clinicUsers = [] } = useClinicUsers();
    const { data: agendaPatients = [] } = useAgendaPatients();
    const userId = user ? String(user.id) : undefined;
    const { data: serviceTypes = EMPTY_SERVICE_TYPES } =
        useServiceTypes(userId);
    const preferences = useAgendaPreferences(userId);
    const savePreference = useSaveAgendaPreference(userId);
    const createMutation = useCreateAppointment();
    const updateMutation = useUpdateAppointment();
    const statusMutation = useUpdateAppointmentStatus();
    const cancelMutation = useCancelAppointment();
    const replaceServiceTypes = useReplaceServiceTypes(userId);
    const [appointments, setAppointments] =
        useState<Appointment[]>(appointmentsData);
    const [syncedData, setSyncedData] = useState(appointmentsData);
    const [viewChoice, setViewChoice] = useState<AgendaViewId | null>(null);
    const [weekendsChoice, setWeekendsChoice] = useState<boolean | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalSeq, setModalSeq] = useState(0);
    const [selectedAppointment, setSelectedAppointment] =
        useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [navHandled, setNavHandled] = useState(false);
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const patientIdFilter = searchParams.get('patientId') ?? undefined;

    const view =
        viewChoice ?? preferences.data?.view ?? DEFAULT_AGENDA_PREFERENCES.view;
    const showWeekends =
        weekendsChoice ??
        preferences.data?.showWeekends ??
        DEFAULT_AGENDA_PREFERENCES.showWeekends;

    const openModal = (appointment: Appointment | null, date: Date | null) => {
        setSelectedAppointment(appointment);
        setSelectedDate(date);
        setModalSeq((n) => n + 1);
        setModalOpen(true);
    };

    // Deep-link da ação rápida "Agendar consulta": abre o modal "Nova consulta"
    // ao chegar com o sinal de navegação. Ajuste de estado durante o render
    // (mesmo padrão de syncedData), guardado para rodar só uma vez.
    const openNewAppointment = (
        location.state as { openNewAppointment?: boolean } | null
    )?.openNewAppointment;
    if (openNewAppointment && !navHandled) {
        setNavHandled(true);
        openModal(null, new Date());
    }

    // Sincroniza o estado local quando os dados do servidor mudam (padrão React:
    // ajuste de estado durante o render, sem setState em useEffect).
    if (appointmentsData !== syncedData) {
        setSyncedData(appointmentsData);
        setAppointments(appointmentsData);
        if (selectedAppointment) {
            const fresh = appointmentsData.find(
                (a) => a.id === selectedAppointment.id,
            );
            if (fresh) setSelectedAppointment(fresh);
        }
    }

    const filteredAppointments = useMemo(
        () =>
            patientIdFilter
                ? appointments.filter((a) => a.patientId === patientIdFilter)
                : appointments,
        [appointments, patientIdFilter],
    );

    // Date.now() não pode ser lido durante o render (resultado instável). Como
    // initialDate só é consumido na montagem do calendário, fixar o instante uma
    // única vez é o comportamento correto.
    const [now] = useState(() => Date.now());

    const calendarInitialDate = useMemo(() => {
        if (!patientIdFilter || filteredAppointments.length === 0) {
            return undefined;
        }
        const upcoming = filteredAppointments
            .map((a) => new Date(a.startsAt))
            .filter((d) => !Number.isNaN(d.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());
        const next = upcoming.find((d) => d.getTime() >= now);
        return next ?? upcoming[0];
    }, [now, patientIdFilter, filteredAppointments]);

    const filteredPatientName = useMemo(() => {
        if (!patientIdFilter) return undefined;
        return (
            agendaPatients.find((p) => p.id === patientIdFilter)?.name ??
            filteredAppointments[0]?.patientName
        );
    }, [patientIdFilter, agendaPatients, filteredAppointments]);

    const changeView = (next: AgendaViewId) => {
        setViewChoice(next);
        // Se gravar falhar, a tela continua na escolha nova.
        savePreference.mutate({ key: 'view', value: next });
    };

    const changeShowWeekends = (show: boolean) => {
        setWeekendsChoice(show);
        savePreference.mutate({ key: 'showWeekends', value: show });
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
            } catch (error) {
                toast.error(
                    apiErrorMessage(
                        error,
                        'Não foi possível atualizar a consulta.',
                    ),
                );
            }
            return;
        }

        try {
            await createMutation.mutateAsync(dto);
            toast.success('Consulta agendada com sucesso!');
            setModalOpen(false);
        } catch (error) {
            toast.error(
                apiErrorMessage(error, 'Não foi possível agendar a consulta.'),
            );
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
        } catch (error) {
            toast.error(
                apiErrorMessage(error, 'Não foi possível alterar o status.'),
            );
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

    const handleSaveServiceTypes = async (items: ServiceTypeDraft[]) => {
        try {
            await replaceServiceTypes.mutateAsync(items);
            toast.success('Tipos de serviço atualizados.');
        } catch (error) {
            toast.error(
                apiErrorMessage(
                    error,
                    'Não foi possível salvar os tipos de serviço.',
                ),
            );
            throw error;
        }
    };

    const persistReschedule = async (
        id: string,
        start: string,
        end: string,
        successMessage: string,
    ) => {
        const apt = appointments.find((a) => a.id === id);
        if (!apt) {
            throw new Error('Consulta não encontrada.');
        }
        if (isTerminalAppointmentStatus(apt.status)) {
            throw new Error('Consulta encerrada não pode ser reagendada.');
        }

        const previous = appointments;
        const startsAt = new Date(start).toISOString();
        const endsAt = new Date(end).toISOString();
        setAppointments((prev) =>
            prev.map((a) => (a.id === id ? { ...a, startsAt, endsAt } : a)),
        );

        try {
            await updateMutation.mutateAsync({
                id,
                dto: appointmentToWriteDto(apt, start, end),
            });
            toast.success(successMessage);
        } catch {
            setAppointments(previous);
            toast.error('Não foi possível reagendar a consulta.');
            throw new Error('reschedule_failed');
        }
    };

    return (
        <ClinicLayout>
            {preferences.isPending ? (
                <div
                    className="h-full bg-ds-surface-body"
                    aria-busy="true"
                    aria-label="Carregando agenda"
                />
            ) : (
                <AgendaView
                    appointments={filteredAppointments}
                    clinicUsers={clinicUsers}
                    showUserFilter={!isPhysio}
                    view={view}
                    onViewChange={changeView}
                    showWeekends={showWeekends}
                    onShowWeekendsChange={changeShowWeekends}
                    filteredPatientName={filteredPatientName}
                    calendarKey={
                        patientIdFilter
                            ? `patient-${patientIdFilter}-${calendarInitialDate?.toISOString() ?? 'empty'}`
                            : 'all'
                    }
                    calendarInitialDate={calendarInitialDate}
                    onEventClick={(apt) => openModal(apt, null)}
                    onDateClick={(date) => openModal(null, date)}
                    onEventDrop={(id, start, end) =>
                        persistReschedule(
                            id,
                            start,
                            end,
                            'Consulta reposicionada.',
                        )
                    }
                    onEventResize={(id, start, end) =>
                        persistReschedule(
                            id,
                            start,
                            end,
                            'Duração da consulta alterada.',
                        )
                    }
                    onNewConsulta={() => openModal(null, new Date())}
                />
            )}

            <AppointmentModal
                // Remonta a cada abertura: o formulário começa da consulta ou
                // do horário escolhido.
                key={modalSeq}
                userId={userId}
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                appointment={selectedAppointment}
                initialDate={selectedDate}
                initialPatientId={patientIdFilter}
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
                serviceTypes={serviceTypes}
                onSaveServiceTypes={
                    can.manageServiceTypes(user?.role)
                        ? handleSaveServiceTypes
                        : undefined
                }
                isSavingServiceTypes={replaceServiceTypes.isPending}
            />
        </ClinicLayout>
    );
}
