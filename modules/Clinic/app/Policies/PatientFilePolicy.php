<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\PatientFile;

class PatientFilePolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true;
    }

    public function view(ClinicUser $user, PatientFile $file): bool
    {
        return true;
    }

    public function create(ClinicUser $user): bool
    {
        return true;
    }

    public function delete(ClinicUser $user, PatientFile $file): bool
    {
        return $user->isPhysiotherapist() && $user->owns($file);
    }
}
