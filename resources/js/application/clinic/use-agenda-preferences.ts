import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AgendaPreferences } from '@/domain/clinic';
import { apiClinicAgendaPreferencesRepository } from '@/infrastructure/repositories';

const repository = apiClinicAgendaPreferencesRepository;
/** Por usuário: o cache não passa de uma sessão para outra no mesmo navegador. */
const queryKey = (userId: string | undefined) =>
    ['agenda', 'preferences', userId] as const;

/** Uma preferência da agenda e o valor novo dela. */
export type AgendaPreferenceChange = {
    [K in keyof AgendaPreferences]: { key: K; value: AgendaPreferences[K] };
}[keyof AgendaPreferences];

/** Valores salvos na conta; o que não foi salvo fica fora (usar o padrão). */
export function useAgendaPreferences(userId: string | undefined) {
    return useQuery({
        queryKey: queryKey(userId),
        queryFn: () => repository.get(),
        enabled: !!userId,
        staleTime: Infinity,
        retry: false,
    });
}

export function useSaveAgendaPreference(userId: string | undefined) {
    const queryClient = useQueryClient();

    return useMutation({
        // Uma gravação por vez: trocar a visão rápido não grava fora de ordem.
        scope: { id: 'agenda-preferences' },
        mutationFn: (change: AgendaPreferenceChange) =>
            repository.save(change.key, change.value),
        onSuccess: (_data, change) =>
            queryClient.setQueryData<Partial<AgendaPreferences>>(
                queryKey(userId),
                (prev) => ({ ...prev, [change.key]: change.value }),
            ),
    });
}
