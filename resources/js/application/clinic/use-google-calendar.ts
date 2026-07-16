import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGoogleCalendarRepository } from '@/infrastructure/repositories';

const repository = apiGoogleCalendarRepository;
const QUERY_KEY = ['google-calendar', 'status'] as const;

export function useGoogleCalendarStatus(enabled = true) {
    return useQuery({
        queryKey: QUERY_KEY,
        queryFn: () => repository.getStatus(),
        enabled,
        staleTime: 60 * 1000,
    });
}

/** Redireciona o navegador para o consentimento OAuth do Google. */
export function useConnectGoogleCalendar() {
    return useMutation({
        mutationFn: (returnTo?: string) => repository.getAuthUrl(returnTo),
        onSuccess: (url) => {
            window.location.href = url;
        },
    });
}

export function useDisconnectGoogleCalendar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => repository.disconnect(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        },
    });
}

/**
 * Enfileira o pull do Google Calendar (worker). Refetch da agenda após um
 * intervalo curto — o job não termina no request HTTP.
 */
export function usePullGoogleCalendar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => repository.pullNow(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            window.setTimeout(() => {
                queryClient.invalidateQueries({
                    queryKey: ['appointments', 'list'],
                });
            }, 4000);
        },
    });
}
