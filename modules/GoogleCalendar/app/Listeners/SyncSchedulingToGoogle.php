<?php

namespace Modules\GoogleCalendar\Listeners;

use Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Events\AppointmentCancelled;
use Modules\ClinicScheduling\Events\AppointmentRescheduled;
use Modules\ClinicScheduling\Events\AppointmentScheduled;
use Modules\GoogleCalendar\Jobs\SyncAppointmentToGoogleJob;

/**
 * Sincroniza o Google Calendar do responsável reagindo aos fatos de
 * agendamento (EDA). Substitui as chamadas diretas que o AppointmentService
 * fazia antes da extração (FR-014/015/018/024).
 */
class SyncSchedulingToGoogle
{
    public function __construct(
        protected ClinicUserGoogleConnectionReadServiceInterface $connections,
        protected AppointmentReadServiceInterface $appointments,
    ) {}

    /** Agendamento criado ou reagendado → cria/atualiza o evento no Google. */
    public function onUpsert(AppointmentScheduled|AppointmentRescheduled $event): void
    {
        if (is_null($event->professionalId)) {
            return;
        }

        if ($this->connections->isConnected($event->professionalId)) {
            SyncAppointmentToGoogleJob::dispatch($event->appointmentId);
        }
    }

    /** Agendamento cancelado → remove o evento correspondente no Google. */
    public function onCancelled(AppointmentCancelled $event): void
    {
        if (is_null($event->professionalId) || !$this->connections->isConnected($event->professionalId)) {
            return;
        }

        $appointment = $this->appointments->getSnapshotById($event->appointmentId);

        if (!is_null($appointment) && !empty($appointment->googleEventId)) {
            SyncAppointmentToGoogleJob::dispatch(
                $event->appointmentId,
                SyncAppointmentToGoogleJob::ACTION_DELETE,
                $appointment->googleEventId,
            );
        }
    }
}
