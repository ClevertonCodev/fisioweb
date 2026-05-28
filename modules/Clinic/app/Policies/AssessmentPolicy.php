<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\Assessment;
use Modules\Clinic\Models\ClinicUser;

class AssessmentPolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true;
    }

    public function view(ClinicUser $user, Assessment $assessment): bool
    {
        return true;
    }

    public function create(ClinicUser $user): bool
    {
        return $user->isPhysiotherapist();
    }

    public function update(ClinicUser $user, Assessment $assessment): bool
    {
        return $user->isPhysiotherapist() && $user->owns($assessment);
    }

    public function sign(ClinicUser $user, Assessment $assessment): bool
    {
        return $user->isPhysiotherapist() && $user->owns($assessment);
    }

    public function delete(ClinicUser $user, Assessment $assessment): bool
    {
        return false; // apenas admin via Gate::before
    }
}
