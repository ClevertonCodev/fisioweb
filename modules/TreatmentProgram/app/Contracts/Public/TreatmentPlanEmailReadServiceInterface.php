<?php

namespace Modules\TreatmentProgram\Contracts\Public;

use Modules\TreatmentProgram\Data\Public\TreatmentPlanEmailDTO;

interface TreatmentPlanEmailReadServiceInterface
{
    public function findForEmail(int $clinicId, int $treatmentPlanId): ?TreatmentPlanEmailDTO;
}
