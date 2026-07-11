<?php

namespace Modules\TreatmentProgram\Policies;

use Modules\TreatmentProgram\Models\TreatmentPlan;

class TreatmentPlanPolicy
{
    public function viewAny($user): bool
    {
        return true;
    }

    public function view($user, TreatmentPlan $plan): bool
    {
        return true;
    }

    public function create($user): bool
    {
        return true;
    }

    public function update($user, TreatmentPlan $plan): bool
    {
        return true;
    }

    public function delete($user, TreatmentPlan $plan): bool
    {
        return false; // apenas admin via Gate::before
    }

    public function duplicate($user, TreatmentPlan $plan): bool
    {
        return true;
    }
}
