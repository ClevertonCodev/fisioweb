<?php

namespace Modules\Email\Services;

use Illuminate\Support\Facades\Mail;
use Modules\Clinic\Contracts\Public\ClinicContactReadServiceInterface;
use Modules\Email\Contracts\TreatmentPlanEmailSenderInterface;
use Modules\Email\Mail\TreatmentPlanSentMail;
use Modules\Email\Support\ClinicDateFormatter;
use Modules\Patient\Contracts\Public\PatientContactReadServiceInterface;
use Modules\TreatmentProgram\Contracts\Public\TreatmentPlanEmailReadServiceInterface;
use Modules\TreatmentProgram\Events\TreatmentPlanEmailRequested;

class TreatmentPlanEmailSender implements TreatmentPlanEmailSenderInterface
{
    public function __construct(
        protected TreatmentPlanEmailReadServiceInterface $plans,
        protected PatientContactReadServiceInterface $patients,
        protected ClinicContactReadServiceInterface $clinics,
    ) {}

    public function send(TreatmentPlanEmailRequested $event): void
    {
        $logContext = [
            'type'              => self::EMAIL_TYPE,
            'clinic_id'         => $event->clinicId,
            'treatment_plan_id' => $event->treatmentPlanId,
            'patient_id'        => $event->patientId,
        ];

        $plan = $this->plans->findForEmail($event->clinicId, $event->treatmentPlanId);

        if (is_null($plan)
            || $plan->clinicId !== $event->clinicId
            || $plan->patientId !== $event->patientId
            || $plan->status === 'draft'
            || empty($plan->shareUrl)) {
            logWarning('Envio de e-mail de programa ignorado: programa indisponível para a clínica', $logContext);

            return;
        }

        $patient = $this->patients->findById($event->clinicId, $event->patientId);

        if (is_null($patient) || empty($patient->email) || !filter_var($patient->email, FILTER_VALIDATE_EMAIL)) {
            logWarning('Envio de e-mail de programa ignorado: paciente sem e-mail', $logContext);

            return;
        }

        $clinic = $this->clinics->findClinic($event->clinicId);

        if (is_null($clinic)) {
            logWarning('Envio de e-mail de programa ignorado: clínica não encontrada', $logContext);

            return;
        }

        $professionalId = $plan->professionalId ?? $event->actorId;
        $professional   = !is_null($professionalId)
            ? $this->clinics->findProfessional($event->clinicId, $professionalId)
            : null;

        $detailsRows = [];
        $start       = ClinicDateFormatter::formatCalendarDate($plan->startDate, $clinic->timezone);
        $end         = ClinicDateFormatter::formatCalendarDate($plan->endDate, $clinic->timezone);

        if (!is_null($start)) {
            $detailsRows[] = ['Início', $start];
        }
        if (!is_null($end)) {
            $detailsRows[] = ['Válido até', $end];
        }
        $detailsRows[] = ['Exercícios', (string) $plan->exercisesCount];

        Mail::to($patient->email)->send(new TreatmentPlanSentMail(
            clinicName: $clinic->name,
            clinicPhone: $clinic->phone,
            clinicAddress: $clinic->formattedAddress(),
            greetingName: $patient->greetingName(),
            programTitle: $plan->title,
            detailsRows: $detailsRows,
            message: $plan->message,
            authorName: is_null($professional) ? null : ClinicDateFormatter::singleLine($professional->name),
            authorRole: is_null($professional) ? null : ClinicDateFormatter::singleLine($professional->roleLabel),
            shareUrl: $plan->shareUrl,
        ));

        logInfo('E-mail de programa enviado', $logContext);
    }
}
