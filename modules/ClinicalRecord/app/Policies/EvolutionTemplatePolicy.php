<?php

namespace Modules\ClinicalRecord\Policies;

use Modules\ClinicalRecord\Models\EvolutionTemplate;

class EvolutionTemplatePolicy
{
    public function viewAny($user): bool
    {
        return true;
    }

    public function view($user, EvolutionTemplate $template): bool
    {
        return true;
    }

    public function create($user): bool
    {
        return true;
    }

    public function update($user, EvolutionTemplate $template): bool
    {
        return true;
    }

    public function delete($user, EvolutionTemplate $template): bool
    {
        return false; // apenas admin via Gate::before
    }
}
