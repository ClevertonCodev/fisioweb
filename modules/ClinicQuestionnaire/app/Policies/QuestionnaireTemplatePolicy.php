<?php

namespace Modules\ClinicQuestionnaire\Policies;

use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;

class QuestionnaireTemplatePolicy
{
    public function viewAny($user): bool
    {
        return true;
    }

    public function view($user, QuestionnaireTemplate $template): bool
    {
        return true;
    }

    public function create($user): bool
    {
        return true;
    }

    public function update($user, QuestionnaireTemplate $template): bool
    {
        return true;
    }

    public function delete($user, QuestionnaireTemplate $template): bool
    {
        return false;
    }
}
