<?php

namespace Modules\Email\Services;

use Illuminate\Support\Facades\Mail;
use Modules\Clinic\Contracts\Public\ClinicContactReadServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Events\AppointmentEmailRequested;
use Modules\Email\Contracts\AppointmentEmailSenderInterface;
use Modules\Email\Mail\AppointmentCancelledMail;
use Modules\Email\Mail\AppointmentMail;
use Modules\Email\Mail\AppointmentRescheduledMail;
use Modules\Email\Mail\AppointmentScheduledMail;
use Modules\Email\Support\ClinicDateFormatter;
use Modules\Email\Support\GoogleMapsLink;
use Modules\Patient\Contracts\Public\PatientContactReadServiceInterface;

class AppointmentEmailSender implements AppointmentEmailSenderInterface
{
    private const KIND_SCHEDULED = 'scheduled';

    private const KIND_RESCHEDULED = 'rescheduled';

    private const KIND_CANCELLED = 'cancelled';

    private const STATUS_CANCELLED = 'cancelled';

    /** @var array<string, class-string<AppointmentMail>> */
    private const MAIL_BY_KIND = [
        self::KIND_SCHEDULED   => AppointmentScheduledMail::class,
        self::KIND_RESCHEDULED => AppointmentRescheduledMail::class,
        self::KIND_CANCELLED   => AppointmentCancelledMail::class,
    ];

    public function __construct(
        protected AppointmentReadServiceInterface $appointments,
        protected PatientContactReadServiceInterface $patients,
        protected ClinicContactReadServiceInterface $clinics,
        protected AppointmentDetailsBuilder $details,
    ) {}

    public function send(AppointmentEmailRequested $event): void
    {
        $logContext = [
            'type'           => self::EMAIL_TYPE_PREFIX . $event->kind,
            'clinic_id'      => $event->clinicId,
            'appointment_id' => $event->appointmentId,
            'patient_id'     => $event->patientId,
        ];

        if (!array_key_exists($event->kind, self::MAIL_BY_KIND)) {
            logWarning('Envio de e-mail de consulta ignorado: tipo sem template', $logContext);

            return;
        }

        $appointment = $this->appointments->getSnapshotById($event->appointmentId);

        if (is_null($appointment)
            || $appointment->clinicId !== $event->clinicId
            || $appointment->patientId !== $event->patientId
            || ($appointment->status === self::STATUS_CANCELLED) !== ($event->kind === self::KIND_CANCELLED)) {
            logWarning('Envio de e-mail de consulta ignorado: consulta indisponível para a clínica', $logContext);

            return;
        }

        $patient = $this->patients->findById($event->clinicId, $event->patientId);

        if (is_null($patient) || empty($patient->email) || !filter_var($patient->email, FILTER_VALIDATE_EMAIL)) {
            logWarning('Envio de e-mail de consulta ignorado: paciente sem e-mail', $logContext);

            return;
        }

        $clinic = $this->clinics->findClinic($event->clinicId);

        if (is_null($clinic)) {
            logWarning('Envio de e-mail de consulta ignorado: clínica não encontrada', $logContext);

            return;
        }

        $timezone = ClinicDateFormatter::safeTimezone($clinic->timezone);
        $startsAt = $appointment->startsAt->setTimezone($timezone);
        $endsAt   = $appointment->endsAt->setTimezone($timezone);

        $mailClass = self::MAIL_BY_KIND[$event->kind];
        $cancelled = $event->kind === self::KIND_CANCELLED;

        Mail::to($patient->email)->send(new $mailClass(
            clinicName: $clinic->name,
            clinicPhone: $clinic->phone,
            clinicAddress: $clinic->formattedAddress(),
            greetingName: $patient->greetingName(),
            subjectDate: $startsAt->format('d/m'),
            subjectTime: $startsAt->format('H:i'),
            detailsRows: $this->details->rows($appointment, $clinic, $startsAt, $endsAt, withPlace: !$cancelled),
            mapsUrl: $cancelled || $appointment->isHomeVisit() ? null : GoogleMapsLink::forClinic($clinic),
        ));

        logInfo('E-mail de consulta enviado', $logContext);
    }
}
