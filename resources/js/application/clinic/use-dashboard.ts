import { useQuery, useQueryClient } from '@tanstack/react-query';

import type {
    DashboardScope,
    OccupancyGranularity,
} from '@/domain/clinic/dashboard';
import { apiClinicDashboardRepository } from '@/infrastructure/repositories';

const repository = apiClinicDashboardRepository;

/**
 * Agregado inicial do dashboard (cards + próximas consultas + flags de papel).
 * `scope` só tem efeito para admin ("clinic" | "mine"); demais papéis são
 * resolvidos pelo backend (fonte de verdade). `day` (dia local) entra na
 * chave para a tela aberta pedir o summary de novo quando o dia vira.
 */
export function useDashboardSummary(scope?: DashboardScope, day?: string) {
    return useQuery({
        queryKey: ['dashboard', 'summary', scope ?? 'clinic', day],
        queryFn: () => repository.getSummary(scope),
    });
}

/**
 * Taxa de ocupação de um fisioterapeuta por granularidade. `queryKey` próprio
 * para recomputar de forma isolada ao trocar filtro (FR-021/SC-006/SC-007).
 */
export function useOccupancyRate(
    granularity: OccupancyGranularity,
    clinicUserId?: string,
) {
    return useQuery({
        queryKey: ['dashboard', 'occupancyRate', granularity, clinicUserId],
        queryFn: () =>
            repository.getOccupancyRate({ granularity, clinicUserId }),
    });
}

/**
 * Feed de Atividades recentes (admin/secretário). `enabled` desliga a query
 * para fisioterapeuta, que recebe 403 (FR-023).
 */
export function useRecentActivities(enabled: boolean) {
    return useQuery({
        queryKey: ['dashboard', 'activities'],
        queryFn: () => repository.getActivities(),
        enabled,
    });
}

/** Captação de pacientes por origem, comparando os últimos 3 anos (FR-015/016). */
export function usePatientAcquisition(scope?: DashboardScope) {
    return useQuery({
        queryKey: ['dashboard', 'patientAcquisition', scope ?? 'clinic'],
        queryFn: () => repository.getPatientAcquisition(scope),
    });
}

/**
 * Pede de novo todos os blocos do dashboard. O botão "Atualizar dados" cobre
 * a tela aberta cujo relógio ou fuso não vira o dia junto com o da clínica.
 */
export function useRefreshDashboard() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
