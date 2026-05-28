<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\QuestionnaireTemplate;

class QuestionnaireTemplatePolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true;
    }

    public function view(ClinicUser $user, QuestionnaireTemplate $template): bool
    {
        return true;
    }

    public function create(ClinicUser $user): bool
    {
        return true;
    }

    public function update(ClinicUser $user, QuestionnaireTemplate $template): bool
    {
        return true;
    }

    public function delete(ClinicUser $user, QuestionnaireTemplate $template): bool
    {
        return false; // apenas admin via Gate::before
    }
}
