<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;

class ClinicUserPolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true;
    }

    public function view(ClinicUser $user, ClinicUser $target): bool
    {
        if ($user->isPhysiotherapist()) {
            return $user->id === $target->id;
        }

        return $user->isSecretary();
    }

    public function create(ClinicUser $user): bool
    {
        return $user->isSecretary();
    }

    public function update(ClinicUser $user, ClinicUser $target): bool
    {
        return $user->isSecretary();
    }

    public function delete(ClinicUser $user, ClinicUser $target): bool
    {
        if ($user->id === $target->id) {
            return false;
        }

        if ($user->isSecretary() && $target->isAdmin()) {
            return false;
        }

        return $user->isSecretary();
    }
}
