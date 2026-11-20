<?php

namespace Modules\Email\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Modules\ClinicQuestionnaire\Events\QuestionnaireEmailRequested;
use Modules\Email\Contracts\QuestionnaireEmailSenderInterface;
use Throwable;

class SendQuestionnaireEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function __construct(
        protected QuestionnaireEmailSenderInterface $sender,
    ) {}

    public function handle(QuestionnaireEmailRequested $event): void
    {
        $this->sender->send($event);
    }

    public function failed(QuestionnaireEmailRequested $event, Throwable $exception): void
    {
        logError('Falha ao enviar e-mail de questionário', [
            'type'                     => QuestionnaireEmailSenderInterface::EMAIL_TYPE,
            'clinic_id'                => $event->clinicId,
            'patient_questionnaire_id' => $event->patientQuestionnaireId,
            'patient_id'               => $event->patientId,
            'exception'                => $exception::class,
        ]);
    }
}
