<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;

class ClinicUserPolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return false;
    }

    public function view(ClinicUser $user, ClinicUser $target): bool
    {
        return (int) $user->id === (int) $target->id;
    }

    public function create(ClinicUser $user): bool
    {
        return false;
    }

    public function update(ClinicUser $user, ClinicUser $target): bool
    {
        return (int) $user->id === (int) $target->id;
    }

    public function delete(ClinicUser $user, ClinicUser $target): bool
    {
        return false;
    }
}
