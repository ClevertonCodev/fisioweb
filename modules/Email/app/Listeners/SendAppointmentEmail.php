<?php

namespace Modules\Email\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Modules\ClinicScheduling\Events\AppointmentEmailRequested;
use Modules\Email\Contracts\AppointmentEmailSenderInterface;
use Throwable;

class SendAppointmentEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function __construct(
        protected AppointmentEmailSenderInterface $sender,
    ) {}

    public function handle(AppointmentEmailRequested $event): void
    {
        $this->sender->send($event);
    }

    public function failed(AppointmentEmailRequested $event, Throwable $exception): void
    {
        logError('Falha ao enviar e-mail de consulta', [
            'type'           => AppointmentEmailSenderInterface::EMAIL_TYPE_PREFIX . $event->kind,
            'clinic_id'      => $event->clinicId,
            'appointment_id' => $event->appointmentId,
            'patient_id'     => $event->patientId,
            'exception'      => $exception::class,
        ]);
    }
}
