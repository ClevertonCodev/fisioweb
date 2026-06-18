import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
    AppointmentListParams,
    AppointmentWriteDto,
} from '@/application/clinic/ports';
import type { AppointmentStatus } from '@/domain/clinic';
import { apiClinicAppointmentsRepository } from '@/infrastructure/repositories';

const repository = apiClinicAppointmentsRepository;

export function useAppointments(params: AppointmentListParams = {}) {
    return useQuery({
        queryKey: ['appointments', 'list', params],
        queryFn: () => repository.list(params),
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

function useInvalidateAppointments() {
    const queryClient = useQueryClient();
    return () =>
        queryClient.invalidateQueries({ queryKey: ['appointments', 'list'] });
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
