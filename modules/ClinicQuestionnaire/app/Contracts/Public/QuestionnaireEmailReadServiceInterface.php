<?php

namespace Modules\ClinicQuestionnaire\Contracts\Public;

use Modules\ClinicQuestionnaire\Data\Public\QuestionnaireEmailDTO;

interface QuestionnaireEmailReadServiceInterface
{
    public function findForEmail(int $clinicId, int $patientQuestionnaireId): ?QuestionnaireEmailDTO;
}
