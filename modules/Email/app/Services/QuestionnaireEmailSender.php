<?php

namespace Modules\Email\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Mail;
use Modules\Clinic\Contracts\Public\ClinicContactReadServiceInterface;
use Modules\ClinicQuestionnaire\Contracts\Public\QuestionnaireEmailReadServiceInterface;
use Modules\ClinicQuestionnaire\Events\QuestionnaireEmailRequested;
use Modules\Email\Contracts\QuestionnaireEmailSenderInterface;
use Modules\Email\Mail\QuestionnaireSentMail;
use Modules\Email\Support\ClinicDateFormatter;
use Modules\Patient\Contracts\Public\PatientContactReadServiceInterface;

class QuestionnaireEmailSender implements QuestionnaireEmailSenderInterface
{
    public function __construct(
        protected QuestionnaireEmailReadServiceInterface $questionnaires,
        protected PatientContactReadServiceInterface $patients,
        protected ClinicContactReadServiceInterface $clinics,
    ) {}

    public function send(QuestionnaireEmailRequested $event): void
    {
        $logContext = [
            'type'                     => self::EMAIL_TYPE,
            'clinic_id'                => $event->clinicId,
            'patient_questionnaire_id' => $event->patientQuestionnaireId,
            'patient_id'               => $event->patientId,
        ];

        $questionnaire = $this->questionnaires->findForEmail($event->clinicId, $event->patientQuestionnaireId);

        if (is_null($questionnaire)
            || $questionnaire->clinicId !== $event->clinicId
            || $questionnaire->patientId !== $event->patientId
            || $questionnaire->status !== 'pending'
            || $this->isExpired($questionnaire->expiresAt)
            || empty($questionnaire->shareUrl)) {
            logWarning('Envio de e-mail de questionário ignorado: questionário indisponível para a clínica', $logContext);

            return;
        }

        $patient = $this->patients->findById($event->clinicId, $event->patientId);

        if (is_null($patient) || empty($patient->email) || !filter_var($patient->email, FILTER_VALIDATE_EMAIL)) {
            logWarning('Envio de e-mail de questionário ignorado: paciente sem e-mail', $logContext);

            return;
        }

        $clinic = $this->clinics->findClinic($event->clinicId);

        if (is_null($clinic)) {
            logWarning('Envio de e-mail de questionário ignorado: clínica não encontrada', $logContext);

            return;
        }

        $minutes     = max(1, (int) round($questionnaire->questionsCount * 15 / 60));
        $minuteLabel = $minutes === 1 ? 'minuto' : 'minutos';
        $detailsRows = [];
        $deadline    = ClinicDateFormatter::formatInstantDate($questionnaire->expiresAt, $clinic->timezone);

        if (!is_null($deadline)) {
            $detailsRows[] = ['Responder até', $deadline];
        }
        $detailsRows[] = ['Tempo', "cerca de {$minutes} {$minuteLabel}"];
        $detailsRows[] = ['Perguntas', (string) $questionnaire->questionsCount];

        Mail::to($patient->email)->send(new QuestionnaireSentMail(
            clinicName: $clinic->name,
            clinicPhone: $clinic->phone,
            clinicAddress: $clinic->formattedAddress(),
            greetingName: $patient->greetingName(),
            questionnaireTitle: $questionnaire->title,
            detailsRows: $detailsRows,
            shareUrl: $questionnaire->shareUrl,
        ));

        logInfo('E-mail de questionário enviado', $logContext);
    }

    private function isExpired(?string $expiresAt): bool
    {
        if (empty($expiresAt)) {
            return false;
        }

        try {
            return CarbonImmutable::parse($expiresAt)->isPast();
        } catch (\Throwable) {
            return true;
        }
    }
}
