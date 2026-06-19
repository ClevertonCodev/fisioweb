import { useQuery } from '@tanstack/react-query';

import type {
    DashboardScope,
    OccupancyGranularity,
} from '@/domain/clinic/dashboard';
import { apiClinicDashboardRepository } from '@/infrastructure/repositories';

const repository = apiClinicDashboardRepository;

/**
 * Agregado inicial do dashboard (cards + próximas consultas + flags de papel).
 * `scope` só tem efeito para admin ("clinic" | "mine"); demais papéis são
 * resolvidos pelo backend (fonte de verdade).
 */
export function useDashboardSummary(scope?: DashboardScope) {
    return useQuery({
        queryKey: ['dashboard', 'summary', scope ?? 'clinic'],
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
