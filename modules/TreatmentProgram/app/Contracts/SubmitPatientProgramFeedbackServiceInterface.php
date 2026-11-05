<?php

namespace Modules\TreatmentProgram\Contracts;

use Modules\TreatmentProgram\DTOs\PatientProgram\SubmitPatientProgramFeedbackData;

interface SubmitPatientProgramFeedbackServiceInterface
{
    /**
     * @return array{id: int, submitted_at: string}
     */
    public function execute(string $publicToken, SubmitPatientProgramFeedbackData $data): array;
}
