import { CalendarCheck, CalendarX } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

import {
    useConnectGoogleCalendar,
    useDisconnectGoogleCalendar,
    useGoogleCalendarStatus,
} from '@/application/clinic';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Controle de conexão Google Calendar do usuário autenticado (FR-013). Só deve
 * ser renderizado no próprio perfil — o OAuth conecta a conta de quem está logado.
 */
export function GoogleCalendarConnection() {
    const { data: status, isLoading } = useGoogleCalendarStatus();
    const connectMutation = useConnectGoogleCalendar();
    const disconnectMutation = useDisconnectGoogleCalendar();

    // Feedback do retorno do callback OAuth (?google=connected|error).
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

    const handleDisconnect = async () => {
        try {
            await disconnectMutation.mutateAsync();
            toast.success('Google Calendar desconectado.');
        } catch {
            toast.error('Não foi possível desconectar.');
        }
    };

    return (
        <div className="rounded-lg border border-border p-4">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-foreground">
                        Google Calendar
                    </h3>
                    <p className="text-xs text-muted-foreground">
                        Conecte sua conta para sincronizar os agendamentos com o
                        seu calendário do Google.
                    </p>
                </div>

                {isLoading ? (
                    <Skeleton className="h-9 w-32" />
                ) : status?.connected ? (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleDisconnect}
                        disabled={disconnectMutation.isPending}
                    >
                        <CalendarX className="h-4 w-4" />
                        Desconectar
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={() => connectMutation.mutate()}
                        disabled={connectMutation.isPending}
                    >
                        <CalendarCheck className="h-4 w-4" />
                        Conectar
                    </Button>
                )}
            </div>

            {status?.connected && (
                <p className="mt-3 text-xs font-medium text-emerald-600">
                    Conta conectada
                    {status.connectedAt
                        ? ` em ${new Date(status.connectedAt).toLocaleDateString('pt-BR')}`
                        : ''}
                    .
                </p>
            )}
        </div>
    );
}
