import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import type {
    AppointmentListParams,
    AppointmentWriteDto,
} from '@/application/clinic/ports';
import type { AppointmentStatus } from '@/domain/clinic';
import { apiClinicAppointmentsRepository } from '@/infrastructure/repositories';

import {
    patientAppointmentsWindow,
    type PatientAppointmentsWindow,
} from './patient-care';
import { nextHistoryPage } from './patient-history-pages';

const repository = apiClinicAppointmentsRepository;

export function useAppointments(params: AppointmentListParams = {}) {
    return useQuery({
        queryKey: ['appointments', 'list', params],
        queryFn: () => repository.list(params),
    });
}

/**
 * Consultas do prontuário: a API filtra pelo paciente (e, para o
 * fisioterapeuta, pelas consultas dele) dentro da janela (ADR 018).
 */
export function usePatientAppointments(
    patientId: string | null,
    window: PatientAppointmentsWindow = patientAppointmentsWindow(),
) {
    const params: AppointmentListParams = {
        from: window.from,
        to: window.to,
        patientId: patientId ?? undefined,
    };
    return useQuery({
        queryKey: ['appointments', 'list', params],
        queryFn: () => repository.list(params),
        enabled: !!patientId,
    });
}

export function useClinicUsers() {
    return useQuery({
        queryKey: ['appointments', 'clinicUsers'],
        queryFn: () => repository.getClinicUsers(),
    });
}

export function useAgendaPatients() {
    return useQuery({
        queryKey: ['appointments', 'agendaPatients'],
        queryFn: () => repository.getAgendaPatients(),
    });
}

/**
 * Histórico completo do paciente (qualquer profissional), paginado da
 * consulta mais recente para a mais antiga. Página `null` = sem acesso.
 */
export function usePatientAppointmentHistory(
    patientId: string | null,
    /** Na chave: o cache de uma sessão não aparece para outro usuário. */
    userId: string | undefined,
) {
    return useInfiniteQuery({
        queryKey: ['appointments', 'history', userId, patientId],
        queryFn: ({ pageParam }) =>
            repository.patientHistory(patientId as string, pageParam),
        initialPageParam: 1,
        getNextPageParam: nextHistoryPage,
        enabled: !!patientId,
        retry: false,
    });
}

function useInvalidateAppointments() {
    const queryClient = useQueryClient();
    return () =>
        Promise.all([
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'list'],
            }),
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'history'],
            }),
        ]);
}

export function useCreateAppointment() {
    const invalidate = useInvalidateAppointments();

    return useMutation({
        mutationFn: (dto: AppointmentWriteDto) => repository.create(dto),
        onSuccess: invalidate,
    });
}

export function useUpdateAppointment() {
    const invalidate = useInvalidateAppointments();

    return useMutation({
        mutationFn: ({ id, dto }: { id: string; dto: AppointmentWriteDto }) =>
            repository.update(id, dto),
        onSuccess: invalidate,
    });
}

export function useUpdateAppointmentStatus() {
    const invalidate = useInvalidateAppointments();

    return useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string;
            status: AppointmentStatus;
        }) => repository.updateStatus(id, status),
        onSuccess: invalidate,
    });
}

export function useCancelAppointment() {
    const invalidate = useInvalidateAppointments();

    return useMutation({
        mutationFn: (id: string) => repository.cancel(id),
        onSuccess: invalidate,
    });
}
