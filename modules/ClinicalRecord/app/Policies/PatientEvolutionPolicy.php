<?php

namespace Modules\ClinicalRecord\Policies;

use Modules\ClinicalRecord\Models\PatientEvolution;

class PatientEvolutionPolicy
{
    public function viewAny($user): bool
    {
        return true;
    }

    public function view($user, PatientEvolution $evolution): bool
    {
        return true;
    }

    public function create($user): bool
    {
        return $user->isPhysiotherapist();
    }

    public function update($user, PatientEvolution $evolution): bool
    {
        return $user->isPhysiotherapist() && $user->owns($evolution);
    }

    public function generateText($user, PatientEvolution $evolution): bool
    {
        return $user->isPhysiotherapist() && $user->owns($evolution);
    }

    public function sign($user, PatientEvolution $evolution): bool
    {
        return $user->isPhysiotherapist() && $user->owns($evolution);
    }

    public function delete($user, PatientEvolution $evolution): bool
    {
        return false; // apenas admin via Gate::before
    }
}
