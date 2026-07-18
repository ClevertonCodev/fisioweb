import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    StatusBadge,
    type StatusBadgeProps,
} from '@/components/ui/status-badge';
import {
    STATUS_COLORS,
    type AppointmentStatus,
} from '@/domain/clinic/appointment';
import type { DashboardUpcomingAppointment } from '@/domain/clinic/dashboard';

interface UpcomingAppointmentsProps {
    items?: DashboardUpcomingAppointment[];
    isLoading: boolean;
    isError: boolean;
}

function initials(name: string): string {
    return (
        name
            .split(' ')
            .map((n) => n[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || '?'
    );
}

function time(iso: string): string {
    return new Date(iso).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function statusLabel(status: string): string {
    return STATUS_COLORS[status as AppointmentStatus]?.label ?? status;
}

/** Mapeia status da consulta → variante do StatusBadge do sistema. */
function statusVariant(
    status: string,
): NonNullable<StatusBadgeProps['variant']> {
    switch (status as AppointmentStatus) {
        case 'scheduled':
            return 'info';
        case 'confirmed':
            return 'success';
        case 'no_show':
            return 'warning';
        case 'completed':
            return 'neutral';
        case 'cancelled':
            return 'danger';
        default:
            return 'neutral';
    }
}

export function UpcomingAppointments({
    items,
    isLoading,
    isError,
}: UpcomingAppointmentsProps) {
    return (
        <Card className="min-w-0">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg">
                        Próximas Consultas
                    </CardTitle>
                    <CardDescription>Agenda de hoje</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/clinica/agenda" className="gap-1">
                        Ver agenda
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {isError ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Não foi possível carregar as consultas.
                    </p>
                ) : isLoading ? (
                    <div className="space-y-4">
                        {[0, 1, 2].map((i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                        ))}
                    </div>
                ) : !items || items.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhuma consulta para hoje.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {items.map((appointment) => (
                            <div
                                key={appointment.id}
                                className="flex items-center gap-4 rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage
                                        src={appointment.patientPhotoUrl}
                                    />
                                    <AvatarFallback className="bg-primary/10 font-medium text-primary">
                                        {initials(appointment.patientName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-medium text-foreground">
                                        {appointment.patientName ||
                                            'Sem paciente'}
                                    </p>
                                    {appointment.title && (
                                        <p className="truncate text-sm text-muted-foreground">
                                            {appointment.title}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-1 text-right">
                                    <p className="font-medium text-foreground">
                                        {time(appointment.startsAt)}
                                    </p>
                                    <StatusBadge
                                        variant={statusVariant(
                                            appointment.status,
                                        )}
                                    >
                                        {statusLabel(appointment.status)}
                                    </StatusBadge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
