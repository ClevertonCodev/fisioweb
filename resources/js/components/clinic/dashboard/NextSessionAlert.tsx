import { useNavigate } from 'react-router-dom';

import { DsBadge, DsButton } from '@/components/ds';
import type { DashboardUpcomingAppointment } from '@/domain/clinic/dashboard';

import {
    initials,
    nextSessionTimingLabel,
    statusLabel,
} from './dashboard-format';

export function NextSessionAlert({
    appointment,
}: {
    appointment: DashboardUpcomingAppointment;
}) {
    const navigate = useNavigate();

    return (
        <article className="overflow-hidden rounded-ds-xl bg-[image:var(--ds-gradient-brand)] p-6 text-ds-white shadow-ds-md ds-dark:bg-[image:linear-gradient(135deg,var(--ds-color-primary-60)_0%,var(--ds-color-primary-100)_100%)]">
            <p className="text-ds-caption tracking-wide text-ds-white/75">
                {nextSessionTimingLabel(appointment.startsAt)}
            </p>
            <div className="mt-4 flex items-center gap-4">
                <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-ds-full bg-ds-white/20 text-ds-body-sm font-semibold">
                    {appointment.patientPhotoUrl ? (
                        <img
                            src={appointment.patientPhotoUrl}
                            alt=""
                            className="size-full object-cover"
                        />
                    ) : (
                        initials(appointment.patientName)
                    )}
                </span>
                <div className="min-w-0">
                    <h2 className="truncate text-ds-body-lg font-semibold">
                        {appointment.patientName || 'Sem paciente'}
                    </h2>
                    <p className="truncate text-ds-body-sm text-ds-white/80">
                        {appointment.title || 'Consulta'}
                    </p>
                </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
                <DsButton
                    size="sm"
                    label="Abrir agenda"
                    onClick={() => navigate('/clinica/agenda')}
                    className="bg-ds-white text-ds-primary-80 hover:bg-ds-white/90 ds-dark:bg-ds-white ds-dark:text-ds-primary-80"
                />
                <DsBadge variant="new">
                    {statusLabel(appointment.status)}
                </DsBadge>
            </div>
        </article>
    );
}
