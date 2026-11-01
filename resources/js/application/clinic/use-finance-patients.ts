import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiClinicFinancePatientsRepository } from '@/infrastructure/repositories/api-clinic-finance-patients';

/** Busca no servidor a partir de 2 letras. */
export const FINANCE_PATIENT_MIN_SEARCH = 2;

/** Pacientes da clínica pelo nome, para o seletor do lançamento de entrada. */
export function useFinancePatientSearch(q: string) {
    const term = q.trim();
    return useQuery({
        queryKey: ['finance', 'patients', { q: term }],
        queryFn: () => apiClinicFinancePatientsRepository.search(term),
        enabled: term.length >= FINANCE_PATIENT_MIN_SEARCH,
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });
}

/** Atendimentos do paciente escolhido, do mais recente para o mais antigo. */
export function useFinancePatientAppointments(patientId: string | null) {
    return useQuery({
        queryKey: ['finance', 'patients', patientId, 'appointments'],
        queryFn: () =>
            apiClinicFinancePatientsRepository.appointments(patientId ?? ''),
        enabled: !!patientId,
    });
}
