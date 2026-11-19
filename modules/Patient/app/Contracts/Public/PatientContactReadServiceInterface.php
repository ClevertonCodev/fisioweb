<?php

namespace Modules\Patient\Contracts\Public;

use Modules\Patient\Data\Public\PatientContactDTO;

interface PatientContactReadServiceInterface
{
    public function findById(int $clinicId, int $patientId): ?PatientContactDTO;
}
