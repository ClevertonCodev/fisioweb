<?php

namespace Modules\GoogleCalendar\Listeners;

use Modules\ClinicScheduling\Events\AppointmentCancelled;
use Modules\ClinicScheduling\Events\AppointmentRescheduled;
use Modules\ClinicScheduling\Events\AppointmentScheduled;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\GoogleCalendar\Jobs\SyncAppointmentToGoogleJob;

/**
 * Sincroniza o Google Calendar do responsável reagindo aos fatos de
 * agendamento (EDA). Substitui as chamadas diretas que o AppointmentService
 * fazia antes da extração (FR-014/015/018/024).
 */
class SyncSchedulingToGoogle
{
    /** Agendamento criado ou reagendado → cria/atualiza o evento no Google. */
    public function onUpsert(AppointmentScheduled|AppointmentRescheduled $event): void
    {
        $appointment = Appointment::find($event->appointmentId);

        if ($appointment?->clinicUser?->isGoogleConnected()) {
            SyncAppointmentToGoogleJob::dispatch($appointment->id);
        }
    }

    /** Agendamento cancelado → remove o evento correspondente no Google. */
    public function onCancelled(AppointmentCancelled $event): void
    {
        $appointment = Appointment::find($event->appointmentId);
        $user        = $appointment?->clinicUser;

        if ($user?->isGoogleConnected() && !empty($appointment->google_event_id)) {
            SyncAppointmentToGoogleJob::dispatch(
                $appointment->id,
                SyncAppointmentToGoogleJob::ACTION_DELETE,
                $appointment->google_event_id,
            );
        }
    }
}
