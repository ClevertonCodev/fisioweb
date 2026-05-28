import { useQuery } from '@tanstack/react-query';

import { mockAppointmentsRepository } from '@/infrastructure/repositories';

export function useAppointments() {
    return useQuery({
        queryKey: ['appointments'],
        queryFn: () => mockAppointmentsRepository.list(),
    });
}

export function useClinicUsers() {
    return useQuery({
        queryKey: ['appointments', 'clinicUsers'],
        queryFn: () => mockAppointmentsRepository.getClinicUsers(),
    });
}

export function useAgendaPatients() {
    return useQuery({
        queryKey: ['appointments', 'agendaPatients'],
        queryFn: () => mockAppointmentsRepository.getAgendaPatients(),
    });
}
