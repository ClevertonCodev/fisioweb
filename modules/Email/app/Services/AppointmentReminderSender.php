<?php

namespace Modules\Email\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Mail;
use Modules\Clinic\Contracts\Public\ClinicContactReadServiceInterface;
use Modules\Clinic\Data\Public\ClinicContactDTO;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO;
use Modules\ClinicScheduling\Events\AppointmentReminderDue;
use Modules\Email\Contracts\AppointmentReminderRepositoryInterface;
use Modules\Email\Contracts\AppointmentReminderSenderInterface;
use Modules\Email\Mail\AppointmentReminderMail;
use Modules\Email\Support\ClinicDateFormatter;
use Modules\Email\Support\GoogleMapsLink;
use Modules\Email\Support\ReminderUnsubscribeLink;
use Modules\Patient\Contracts\Public\PatientContactReadServiceInterface;
use Modules\Patient\Data\Public\PatientContactDTO;
use Throwable;

class AppointmentReminderSender implements AppointmentReminderSenderInterface
{
    private const REMINDABLE_STATUSES = ['scheduled', 'confirmed'];

    public function __construct(
        protected AppointmentReadServiceInterface $appointments,
        protected PatientContactReadServiceInterface $patients,
        protected ClinicContactReadServiceInterface $clinics,
        protected AppointmentDetailsBuilder $details,
        protected AppointmentReminderRepositoryInterface $reminders,
    ) {}

    public function send(AppointmentReminderDue $event): void
    {
        $logContext = [
            'type'           => self::EMAIL_TYPE,
            'clinic_id'      => $event->clinicId,
            'appointment_id' => $event->appointmentId,
            'patient_id'     => $event->patientId,
        ];

        $appointment = $this->appointments->getSnapshotById($event->appointmentId);

        if (is_null($appointment)
            || $appointment->clinicId !== $event->clinicId
            || $appointment->patientId !== $event->patientId
            || !$appointment->startsAt->equalTo($event->startsAt)
            || !$appointment->startsAt->isFuture()
            || !in_array($appointment->status, self::REMINDABLE_STATUSES, true)) {
            logWarning('Lembrete de consulta ignorado: consulta indisponível para a clínica ou mudou desde a rodada', $logContext);

            return;
        }

        $patient = $this->patients->findById($event->clinicId, $event->patientId);
        $clinic  = $this->clinics->findClinic($event->clinicId);

        if (is_null($patient) || is_null($clinic)) {
            logWarning('Lembrete de consulta ignorado: paciente ou clínica não encontrados', $logContext);

            return;
        }

        if ($clinic->cancelled || !$clinic->appointmentReminderEmailEnabled) {
            logInfo('Lembrete de consulta ignorado: clínica cancelada ou com o lembrete desligado', $logContext);

            return;
        }

        if (empty($patient->email) || !filter_var($patient->email, FILTER_VALIDATE_EMAIL)) {
            logInfo('Lembrete de consulta ignorado: paciente sem e-mail', $logContext);

            return;
        }

        if (!$patient->active) {
            logInfo('Lembrete de consulta ignorado: paciente inativo', $logContext);

            return;
        }

        if (!$patient->receivesAppointmentReminderEmail) {
            logInfo('Lembrete de consulta ignorado: paciente não recebe lembrete', $logContext);

            return;
        }

        if (!$this->reminders->reserve($event->clinicId, $event->appointmentId, $appointment->startsAt)) {
            logInfo('Lembrete de consulta ignorado: horário já lembrado', $logContext);

            return;
        }

        try {
            Mail::to($patient->email)->send($this->buildMail($appointment, $patient, $clinic));
        } catch (Throwable $exception) {
            $this->reminders->release($event->appointmentId, $appointment->startsAt);

            throw $exception;
        }

        logInfo('Lembrete de consulta enviado', $logContext);
    }

    private function buildMail(
        AppointmentSnapshotDTO $appointment,
        PatientContactDTO $patient,
        ClinicContactDTO $clinic,
    ): AppointmentReminderMail {
        $timezone = ClinicDateFormatter::safeTimezone($clinic->timezone);
        $startsAt = $appointment->startsAt->setTimezone($timezone);
        $endsAt   = $appointment->endsAt->setTimezone($timezone);
        $isToday  = $startsAt->isSameDay(CarbonImmutable::now($timezone));

        return new AppointmentReminderMail(
            clinicName: $clinic->name,
            clinicPhone: $clinic->phone,
            clinicAddress: $clinic->formattedAddress(),
            greetingName: $patient->greetingName(),
            subjectDate: $startsAt->format('d/m'),
            subjectTime: $startsAt->format('H:i'),
            detailsRows: $this->details->rows(
                $appointment,
                $clinic,
                $startsAt,
                $endsAt,
                withPlace: true,
                dayLabel: $isToday ? 'Hoje' : 'Amanhã',
            ),
            mapsUrl: $appointment->isHomeVisit() ? null : GoogleMapsLink::forClinic($clinic),
            dayWord: $isToday ? 'hoje' : 'amanhã',
            unsubscribeUrl: ReminderUnsubscribeLink::url($clinic->id, $patient->id),
        );
    }
}
