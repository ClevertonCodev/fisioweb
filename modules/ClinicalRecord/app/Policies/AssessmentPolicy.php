<?php

namespace Modules\ClinicalRecord\Policies;

use Modules\ClinicalRecord\Models\Assessment;

class AssessmentPolicy
{
    public function viewAny($user): bool
    {
        return true;
    }

    public function view($user, Assessment $assessment): bool
    {
        return true;
    }

    public function create($user): bool
    {
        return $user->isPhysiotherapist();
    }

    public function update($user, Assessment $assessment): bool
    {
        return $user->isPhysiotherapist() && $user->owns($assessment);
    }

    public function sign($user, Assessment $assessment): bool
    {
        return $user->isPhysiotherapist() && $user->owns($assessment);
    }

    public function delete($user, Assessment $assessment): bool
    {
        return false; // apenas admin via Gate::before
    }
}
