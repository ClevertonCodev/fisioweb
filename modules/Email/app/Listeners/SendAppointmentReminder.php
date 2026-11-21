<?php

namespace Modules\Email\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Modules\ClinicScheduling\Events\AppointmentReminderDue;
use Modules\Email\Contracts\AppointmentReminderSenderInterface;
use Throwable;

class SendAppointmentReminder implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function __construct(
        protected AppointmentReminderSenderInterface $sender,
    ) {}

    public function handle(AppointmentReminderDue $event): void
    {
        $this->sender->send($event);
    }

    public function failed(AppointmentReminderDue $event, Throwable $exception): void
    {
        logError('Falha ao enviar lembrete de consulta', [
            'type'           => AppointmentReminderSenderInterface::EMAIL_TYPE,
            'clinic_id'      => $event->clinicId,
            'appointment_id' => $event->appointmentId,
            'patient_id'     => $event->patientId,
            'exception'      => $exception::class,
        ]);
    }
}
