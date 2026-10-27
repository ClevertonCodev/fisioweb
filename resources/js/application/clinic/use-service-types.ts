import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ServiceTypeDraft } from '@/domain/clinic';
import { apiClinicServiceTypesRepository } from '@/infrastructure/repositories';

const repository = apiClinicServiceTypesRepository;
/** Por usuário: o cache não passa de uma sessão (ou clínica) para outra. */
const queryKey = (userId: string | undefined) =>
    ['service-types', userId] as const;

/** Tipos de serviço da clínica (atalhos do modal de consulta). */
export function useServiceTypes(userId: string | undefined) {
    return useQuery({
        queryKey: queryKey(userId),
        enabled: !!userId,
        queryFn: () => repository.list(),
    });
}

export function useReplaceServiceTypes(userId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (items: ServiceTypeDraft[]) => repository.replace(items),
        onSuccess: (types) => queryClient.setQueryData(queryKey(userId), types),
    });
}
