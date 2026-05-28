<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\PatientQuestionnaire;

class PatientQuestionnairePolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return true;
    }

    public function view(ClinicUser $user, PatientQuestionnaire $questionnaire): bool
    {
        return true;
    }

    public function create(ClinicUser $user): bool
    {
        return true;
    }

    public function delete(ClinicUser $user, PatientQuestionnaire $questionnaire): bool
    {
        return $user->isPhysiotherapist() && $user->owns($questionnaire);
    }
}
