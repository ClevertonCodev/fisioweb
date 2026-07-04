<?php

namespace Modules\TreatmentProgram\Listeners;

use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanRepositoryInterface;
use Modules\TreatmentProgram\Events\TreatmentPlanActivated;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\WhatsApp\Jobs\SendWhatsAppMessageJob;

class SendTreatmentPlanActivationNotification
{
    public function __construct(
        private PatientServiceInterface $patients,
        private TreatmentPlanRepositoryInterface $treatmentPlans,
    ) {}

    public function handle(TreatmentPlanActivated $event): void
    {
        $plan = $this->treatmentPlans->find($event->treatmentPlanId);
        if (is_null($plan) || $plan->status !== TreatmentPlan::STATUS_ACTIVE || empty($plan->patient_id)) {
            return;
        }

        $patient = $this->patients->find($event->patientId);
        if (is_null($patient) || empty($patient->phone) || (int) $patient->clinic_id !== (int) $plan->clinic_id) {
            return;
        }

        $message = trim((string) $plan->message);
        if (empty($message)) {
            $message = 'Ola! Seu programa de tratamento esta disponivel no app.';
        }

        SendWhatsAppMessageJob::dispatch(
            to: $patient->phone,
            body: $message,
        );
    }
}
