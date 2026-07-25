<?php

namespace Modules\TreatmentProgram\Contracts;

use Modules\TreatmentProgram\Models\TreatmentPlanFeedback;

interface TreatmentPlanFeedbackRepositoryInterface
{
    public function create(array $data): TreatmentPlanFeedback;

    public function hasFeedbackForCycle(int $treatmentPlanId, int $patientId, ?int $executionId): bool;
}
