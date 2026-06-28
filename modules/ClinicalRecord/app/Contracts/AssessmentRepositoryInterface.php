<?php

namespace Modules\ClinicalRecord\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Models\Assessment;

interface AssessmentRepositoryInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function findForClinic(int $id, int $clinicId): Assessment;

    public function create(array $data): Assessment;

    public function deleteAnswers(Assessment $assessment): void;

    public function createAnswer(Assessment $assessment, int $fieldId, ?string $value): void;

    public function createAnswerOption(Assessment $assessment, int $fieldId, int $optionId): void;
}
