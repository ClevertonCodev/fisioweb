<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\PatientEvolution;

class PatientEvolutionPolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true;
    }

    public function view(ClinicUser $user, PatientEvolution $evolution): bool
    {
        return true;
    }

    public function create(ClinicUser $user): bool
    {
        return $user->isPhysiotherapist();
    }

    public function update(ClinicUser $user, PatientEvolution $evolution): bool
    {
        return $user->isPhysiotherapist() && $user->owns($evolution);
    }

    public function generateText(ClinicUser $user, PatientEvolution $evolution): bool
    {
        return $user->isPhysiotherapist() && $user->owns($evolution);
    }

    public function sign(ClinicUser $user, PatientEvolution $evolution): bool
    {
        return $user->isPhysiotherapist() && $user->owns($evolution);
    }

    public function delete(ClinicUser $user, PatientEvolution $evolution): bool
    {
        return false; // apenas admin via Gate::before
    }
}
