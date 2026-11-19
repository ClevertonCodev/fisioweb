<?php

namespace Modules\Clinic\Contracts\Public;

use Modules\Clinic\Data\Public\ClinicContactDTO;
use Modules\Clinic\Data\Public\ClinicProfessionalDTO;

interface ClinicContactReadServiceInterface
{
    public function findClinic(int $clinicId): ?ClinicContactDTO;

    public function findProfessional(int $clinicId, int $clinicUserId): ?ClinicProfessionalDTO;
}
