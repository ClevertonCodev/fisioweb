<?php

namespace Modules\ClinicQuestionnaire\Policies;

use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;

class PatientQuestionnairePolicy
{
    public function viewAny($user): bool
    {
        return true;
    }

    public function view($user, PatientQuestionnaire $questionnaire): bool
    {
        return true;
    }

    public function create($user): bool
    {
        return true;
    }

    public function delete($user, PatientQuestionnaire $questionnaire): bool
    {
        return $user->isPhysiotherapist() && $user->owns($questionnaire);
    }
}
