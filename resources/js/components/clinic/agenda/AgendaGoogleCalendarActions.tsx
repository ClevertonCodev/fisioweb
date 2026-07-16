import { CalendarCheck, CalendarSync, CalendarX, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import {
    useConnectGoogleCalendar,
    useDisconnectGoogleCalendar,
    useGoogleCalendarStatus,
    usePullGoogleCalendar,
} from '@/application/clinic';
import { Button } from '@/components/ui/button';

/**
 * Ações Google Calendar na coluna esquerda da Agenda: conectar/desconectar e
 * atualizar a agenda sob demanda.
 */
export function AgendaGoogleCalendarActions() {
    const { data: status, isLoading } = useGoogleCalendarStatus();
    const connectMutation = useConnectGoogleCalendar();
    const disconnectMutation = useDisconnectGoogleCalendar();
    const pullMutation = usePullGoogleCalendar();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const result = params.get('google');
        if (result === 'connected') {
            toast.success('Google Calendar conectado com sucesso!');
        } else if (result === 'error') {
            toast.error('Não foi possível conectar o Google Calendar.');
        }
        if (result) {
            params.delete('google');
            const query = params.toString();
            window.history.replaceState(
                {},
                '',
                window.location.pathname + (query ? `?${query}` : ''),
            );
        }
    }, []);

    const connected = Boolean(status?.connected);
    const busy =
        connectMutation.isPending ||
        disconnectMutation.isPending ||
        pullMutation.isPending;

    const handleDisconnect = async () => {
        try {
            await disconnectMutation.mutateAsync();
            toast.success('Google Calendar desconectado.');
        } catch {
            toast.error('Não foi possível desconectar.');
        }
    };

    const handlePull = async () => {
        try {
            await pullMutation.mutateAsync();
            toast.success('Agenda atualizada com o Google.');
        } catch {
            toast.error('Não foi possível atualizar a agenda agora.');
        }
    };

    if (isLoading) {
        return null;
    }

    return (
        <div className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Google Calendar
            </h3>
            <div className="space-y-2">
                {connected ? (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={busy}
                        className="h-auto w-full cursor-pointer justify-start gap-2 px-2 py-2 text-left"
                    >
                        {disconnectMutation.isPending ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                        ) : (
                            <CalendarX className="h-4 w-4 shrink-0" />
                        )}
                        <span className="text-xs">Desconectar Google</span>
                    </Button>
                ) : (
                    <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                            connectMutation.mutate('/clinica/agenda')
                        }
                        disabled={busy}
                        className="h-auto w-full cursor-pointer justify-start gap-2 px-2 py-2 text-left"
                    >
                        {connectMutation.isPending ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                        ) : (
                            <CalendarCheck className="h-4 w-4 shrink-0" />
                        )}
                        <span className="text-xs">Conectar com Google</span>
                    </Button>
                )}

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePull}
                    disabled={!connected || busy}
                    className="h-auto w-full cursor-pointer justify-start gap-2 px-2 py-2 text-left disabled:cursor-not-allowed"
                >
                    {pullMutation.isPending ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                        <CalendarSync className="h-4 w-4 shrink-0" />
                    )}
                    <span className="text-xs">Atualizar agenda agora</span>
                </Button>
            </div>
        </div>
    );
}
