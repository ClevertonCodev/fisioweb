<?php

namespace Modules\ClinicalRecord\Policies;

use Modules\ClinicalRecord\Models\PatientFile;

class PatientFilePolicy
{
    public function viewAny($user): bool
    {
        return true;
    }

    public function view($user, PatientFile $file): bool
    {
        return true;
    }

    public function create($user): bool
    {
        return true;
    }

    public function delete($user, PatientFile $file): bool
    {
        return $user->isPhysiotherapist() && $user->owns($file);
    }
}
