import { CalendarCheck, CalendarSync, CalendarX } from 'lucide-react';
import { toast } from 'sonner';

import {
    useConnectGoogleCalendar,
    useDisconnectGoogleCalendar,
    useGoogleCalendarStatus,
    usePullGoogleCalendar,
} from '@/application/clinic';
import { DsButton, dsCn } from '@/components/ds';

/**
 * PROTOTYPE — mesmas ações do AgendaGoogleCalendarActions, com DsButton.
 * O toast de retorno do OAuth (`?google=`) continua só na versão v1.
 */
export function DsGoogleCalendarActions({
    compact = false,
    className,
}: {
    compact?: boolean;
    className?: string;
}) {
    const { data: status, isLoading } = useGoogleCalendarStatus();
    const connectMutation = useConnectGoogleCalendar();
    const disconnectMutation = useDisconnectGoogleCalendar();
    const pullMutation = usePullGoogleCalendar();

    if (isLoading) return null;

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

    if (compact) {
        return (
            <div className={dsCn('flex items-center gap-1', className)}>
                <DsButton
                    variant="tertiary"
                    size="sm"
                    iconPosition="only"
                    icon={<CalendarSync />}
                    label="Atualizar com o Google"
                    disabled={!connected || busy}
                    loading={pullMutation.isPending}
                    onClick={handlePull}
                />
                {connected ? (
                    <DsButton
                        variant="tertiary"
                        size="sm"
                        iconPosition="only"
                        icon={<CalendarX />}
                        label="Desconectar Google"
                        disabled={busy}
                        loading={disconnectMutation.isPending}
                        onClick={handleDisconnect}
                    />
                ) : (
                    <DsButton
                        iconPosition="left"
                        variant="secondary"
                        size="sm"
                        icon={<CalendarCheck />}
                        label="Conectar Google"
                        disabled={busy}
                        loading={connectMutation.isPending}
                        onClick={() =>
                            connectMutation.mutate('/clinica/agenda')
                        }
                    />
                )}
            </div>
        );
    }

    return (
        <div className={dsCn('space-y-3', className)}>
            <div className="flex items-center gap-2">
                <h3 className="text-ds-caption font-semibold tracking-wider text-ds-content-muted uppercase">
                    Google Calendar
                </h3>
                <span
                    className={dsCn(
                        'size-2 rounded-ds-full',
                        connected
                            ? 'bg-ds-status-success-content'
                            : 'bg-ds-border-strong',
                    )}
                />
            </div>
            <div className="space-y-2">
                {connected ? (
                    <DsButton
                        iconPosition="left"
                        variant="secondary"
                        size="full"
                        icon={<CalendarX />}
                        label="Desconectar Google"
                        disabled={busy}
                        loading={disconnectMutation.isPending}
                        onClick={handleDisconnect}
                    />
                ) : (
                    <DsButton
                        iconPosition="left"
                        variant="primary"
                        size="full"
                        icon={<CalendarCheck />}
                        label="Conectar com Google"
                        disabled={busy}
                        loading={connectMutation.isPending}
                        onClick={() =>
                            connectMutation.mutate('/clinica/agenda')
                        }
                    />
                )}
                <DsButton
                    iconPosition="left"
                    variant="tertiary"
                    size="full"
                    icon={<CalendarSync />}
                    label="Atualizar agenda agora"
                    disabled={!connected || busy}
                    loading={pullMutation.isPending}
                    onClick={handlePull}
                />
            </div>
        </div>
    );
}
