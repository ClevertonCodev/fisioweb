<?php

namespace Modules\Email\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Modules\Clinic\Contracts\Public\ClinicContactReadServiceInterface;
use Modules\Clinic\Data\Public\ClinicContactDTO;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO;
use Modules\ClinicScheduling\Events\AppointmentEmailRequested;
use Modules\Email\Contracts\AppointmentEmailSenderInterface;
use Modules\Email\Mail\AppointmentScheduledMail;
use Modules\Email\Support\GoogleMapsLink;
use Modules\Patient\Contracts\Public\PatientContactReadServiceInterface;

class AppointmentEmailSender implements AppointmentEmailSenderInterface
{
    private const KIND_SCHEDULED = 'scheduled';

    private const STATUS_CANCELLED = 'cancelled';

    public function __construct(
        protected AppointmentReadServiceInterface $appointments,
        protected PatientContactReadServiceInterface $patients,
        protected ClinicContactReadServiceInterface $clinics,
    ) {}

    public function send(AppointmentEmailRequested $event): void
    {
        $logContext = [
            'type'           => self::EMAIL_TYPE_PREFIX . $event->kind,
            'clinic_id'      => $event->clinicId,
            'appointment_id' => $event->appointmentId,
            'patient_id'     => $event->patientId,
        ];

        if ($event->kind !== self::KIND_SCHEDULED) {
            logWarning('Envio de e-mail de consulta ignorado: tipo sem template', $logContext);

            return;
        }

        $appointment = $this->appointments->getSnapshotById($event->appointmentId);

        if (is_null($appointment)
            || $appointment->clinicId !== $event->clinicId
            || $appointment->patientId !== $event->patientId
            || $appointment->status === self::STATUS_CANCELLED) {
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

        $timezone = $this->safeTimezone($clinic->timezone);
        $startsAt = $appointment->startsAt->setTimezone($timezone);
        $endsAt   = $appointment->endsAt->setTimezone($timezone);

        Mail::to($patient->email)->send(new AppointmentScheduledMail(
            clinicName: $clinic->name,
            clinicPhone: $clinic->phone,
            clinicAddress: $clinic->formattedAddress(),
            greetingName: $patient->greetingName(),
            subjectDate: $startsAt->format('d/m'),
            subjectTime: $startsAt->format('H:i'),
            detailsRows: $this->detailsRows($appointment, $clinic, $startsAt, $endsAt),
            mapsUrl: $appointment->isHomeVisit() ? null : GoogleMapsLink::forClinic($clinic),
        ));

        logInfo('E-mail de consulta enviado', $logContext);
    }

    /**
     * @return list<array{0: string, 1: string}>
     */
    private function detailsRows(
        AppointmentSnapshotDTO $appointment,
        ClinicContactDTO $clinic,
        CarbonImmutable $startsAt,
        CarbonImmutable $endsAt,
    ): array {
        $weekday = Str::ucfirst($startsAt->locale('pt_BR')->isoFormat('dddd'));
        $rows    = [
            ['Data', "{$weekday}, {$startsAt->format('d/m/Y')}"],
            ['Horário', "{$startsAt->format('H:i')} às {$endsAt->format('H:i')}"],
        ];

        if (!is_null($appointment->clinicUserId)) {
            $professional = $this->clinics->findProfessional($clinic->id, $appointment->clinicUserId);

            if (!is_null($professional) && !empty(trim($professional->name))) {
                $rows[] = ['Profissional', trim($professional->name)];
            }
        }

        $place = $appointment->isHomeVisit()
            ? 'Atendimento em domicílio'
            : implode(' · ', array_values(array_filter(
                [(string) $appointment->room(), (string) $clinic->formattedAddress()],
                fn (string $part) => !empty($part),
            )));

        if (!empty($place)) {
            $rows[] = ['Local', $place];
        }

        return $rows;
    }

    private function safeTimezone(string $timezone): string
    {
        return in_array($timezone, timezone_identifiers_list(), true)
            ? $timezone
            : (string) config('app.timezone', 'America/Sao_Paulo');
    }
}
