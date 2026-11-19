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
        if (is_null($user->clinic_id) || is_null($plan->clinic_id)) {
            return false;
        }

        return (int) $user->clinic_id === (int) $plan->clinic_id;
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
