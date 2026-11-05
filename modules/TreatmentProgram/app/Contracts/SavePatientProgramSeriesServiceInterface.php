<?php

namespace Modules\TreatmentProgram\Contracts;

use Modules\TreatmentProgram\DTOs\PatientProgram\SavePatientProgramSeriesData;

interface SavePatientProgramSeriesServiceInterface
{
    /**
     * @return array{execution_id: int, exercise_id: int, series_count: int}
     */
    public function execute(
        string $publicToken,
        int $executionId,
        SavePatientProgramSeriesData $data,
    ): array;
}
