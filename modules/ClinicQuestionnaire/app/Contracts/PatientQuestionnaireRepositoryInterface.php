<?php

namespace Modules\ClinicQuestionnaire\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;

interface PatientQuestionnaireRepositoryInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function find(int $id): PatientQuestionnaire;

    public function findForPublic(int $id): PatientQuestionnaire;

    public function create(array $data): PatientQuestionnaire;

    public function update(PatientQuestionnaire $questionnaire, array $data): PatientQuestionnaire;

    public function saveAnswers(PatientQuestionnaire $questionnaire, array $answers): void;

    public function delete(PatientQuestionnaire $questionnaire): void;
}
