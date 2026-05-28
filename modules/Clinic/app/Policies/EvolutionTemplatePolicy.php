<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\EvolutionTemplate;

class EvolutionTemplatePolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true;
    }

    public function view(ClinicUser $user, EvolutionTemplate $template): bool
    {
        return true;
    }

    public function create(ClinicUser $user): bool
    {
        return true;
    }

    public function update(ClinicUser $user, EvolutionTemplate $template): bool
    {
        return true;
    }

    public function delete(ClinicUser $user, EvolutionTemplate $template): bool
    {
        return false; // apenas admin via Gate::before
    }
}
