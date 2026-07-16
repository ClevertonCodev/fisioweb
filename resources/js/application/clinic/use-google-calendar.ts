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

/** Puxa o Google Calendar na hora (request síncrono) e refetch a agenda. */
export function usePullGoogleCalendar() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => repository.pullNow(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
            queryClient.invalidateQueries({
                queryKey: ['appointments', 'list'],
            });
        },
    });
}
