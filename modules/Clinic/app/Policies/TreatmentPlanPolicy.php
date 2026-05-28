<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\TreatmentPlan;

class TreatmentPlanPolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true;
    }

    public function view(ClinicUser $user, TreatmentPlan $plan): bool
    {
        return true;
    }

    public function create(ClinicUser $user): bool
    {
        return true;
    }

    public function update(ClinicUser $user, TreatmentPlan $plan): bool
    {
        return true;
    }

    public function delete(ClinicUser $user, TreatmentPlan $plan): bool
    {
        return false; // apenas admin via Gate::before
    }

    public function duplicate(ClinicUser $user, TreatmentPlan $plan): bool
    {
        return true;
    }
}
