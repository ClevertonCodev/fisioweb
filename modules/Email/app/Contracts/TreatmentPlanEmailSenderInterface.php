<?php

namespace Modules\Email\Contracts;

use Modules\TreatmentProgram\Events\TreatmentPlanEmailRequested;

interface TreatmentPlanEmailSenderInterface
{
    public const EMAIL_TYPE = 'treatment_plan_sent';

    public function send(TreatmentPlanEmailRequested $event): void;
}
