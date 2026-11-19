<?php

namespace Modules\Email\Listeners;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Modules\Email\Contracts\TreatmentPlanEmailSenderInterface;
use Modules\TreatmentProgram\Events\TreatmentPlanEmailRequested;
use Throwable;

class SendTreatmentPlanEmail implements ShouldQueue
{
    use InteractsWithQueue;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [10, 30, 60];

    public function __construct(
        protected TreatmentPlanEmailSenderInterface $sender,
    ) {}

    public function handle(TreatmentPlanEmailRequested $event): void
    {
        $this->sender->send($event);
    }

    public function failed(TreatmentPlanEmailRequested $event, Throwable $exception): void
    {
        logError('Falha ao enviar e-mail de programa', [
            'type'              => TreatmentPlanEmailSenderInterface::EMAIL_TYPE,
            'clinic_id'         => $event->clinicId,
            'treatment_plan_id' => $event->treatmentPlanId,
            'patient_id'        => $event->patientId,
            'exception'         => $exception::class,
        ]);
    }
}
