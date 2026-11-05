<?php

namespace Modules\TreatmentProgram\Contracts;

use Modules\TreatmentProgram\DTOs\PatientProgram\UpdateUnfinishedExercisesData;

interface UpdateUnfinishedExercisesServiceInterface
{
    /**
     * @return array<string, mixed>
     */
    public function execute(
        string $publicToken,
        int $executionId,
        UpdateUnfinishedExercisesData $data,
    ): array;
}
