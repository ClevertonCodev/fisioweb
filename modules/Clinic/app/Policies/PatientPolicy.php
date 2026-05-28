<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;

class PatientPolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true;
    }

    public function view(ClinicUser $user, Patient $patient): bool
    {
        return true;
    }

    public function create(ClinicUser $user): bool
    {
        return true;
    }

    public function update(ClinicUser $user, Patient $patient): bool
    {
        return true;
    }

    public function delete(ClinicUser $user, Patient $patient): bool
    {
        return false; // apenas admin via Gate::before
    }

    public function bulkInactivate(ClinicUser $user): bool
    {
        return $user->isSecretary();
    }
}
