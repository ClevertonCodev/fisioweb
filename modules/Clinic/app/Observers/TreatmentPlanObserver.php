<?php

namespace Modules\Clinic\Observers;

use Modules\Clinic\Models\TreatmentPlan;
use Modules\WhatsApp\Jobs\SendWhatsAppMessageJob;

class TreatmentPlanObserver
{
    public function created(TreatmentPlan $treatmentPlan): void
    {
        $this->dispatchIfNeeded($treatmentPlan, false);
    }

    public function updated(TreatmentPlan $treatmentPlan): void
    {
        $statusJustActivated = $treatmentPlan->wasChanged('status')
            && $treatmentPlan->status === TreatmentPlan::STATUS_ACTIVE;

        $this->dispatchIfNeeded($treatmentPlan, $statusJustActivated);
    }

    private function dispatchIfNeeded(TreatmentPlan $treatmentPlan, bool $statusJustActivated): void
    {
        if (!$statusJustActivated && $treatmentPlan->wasRecentlyCreated === false) {
            return;
        }

        if ($treatmentPlan->status !== TreatmentPlan::STATUS_ACTIVE || !$treatmentPlan->patient_id) {
            return;
        }

        $treatmentPlan->loadMissing('patient');
        $patient = $treatmentPlan->patient;

        if (!$patient || !$patient->phone || $patient->clinic_id !== $treatmentPlan->clinic_id) {
            return;
        }

        $message = trim((string) $treatmentPlan->message);
        if ($message === '') {
            $message = 'Ola! Seu programa de tratamento esta disponivel no app.';
        }

        SendWhatsAppMessageJob::dispatch(
            to: $patient->phone,
            body: $message,
        );
    }
}
