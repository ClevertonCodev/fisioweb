<?php

namespace Modules\WhatsApp\Listeners;

use Modules\ClinicQuestionnaire\Events\QuestionnaireSent;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\WhatsApp\Contracts\WhatsAppServiceInterface;

class SendQuestionnaireWhatsAppListener
{
    public function __construct(
        protected WhatsAppServiceInterface $whatsApp,
        protected PatientServiceInterface $patientService,
    ) {}

    public function handle(QuestionnaireSent $event): void
    {
        if ($event->modality !== 'remoto' || !$this->whatsApp->isConfigured()) {
            return;
        }

        $patient = $this->patientService->find($event->patientId);

        if (is_null($patient) || empty($patient->phone)) {
            return;
        }

        $link = url('/api/questionnaires/' . $event->patientQuestionnaireId);

        $this->whatsApp->send(
            WhatsAppServiceInterface::normalizePhone($patient->phone),
            'Você recebeu um questionário da clínica. Acesse o link para responder: ' . $link,
        );
    }
}
