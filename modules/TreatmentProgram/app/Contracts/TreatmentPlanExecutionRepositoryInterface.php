<?php

namespace Modules\TreatmentProgram\Contracts;

use Modules\TreatmentProgram\Models\TreatmentPlanExecution;

interface TreatmentPlanExecutionRepositoryInterface
{
    public function findInProgress(int $treatmentPlanId, int $patientId): ?TreatmentPlanExecution;

    public function findForPatient(int $executionId, int $treatmentPlanId, int $patientId): ?TreatmentPlanExecution;

    public function create(array $data): TreatmentPlanExecution;

    public function update(int $executionId, array $data): TreatmentPlanExecution;

    /**
     * @param  list<array{count: int|null, weight_value: string|null, weight_unit: string|null, is_bodyweight: bool}>  $series
     */
    public function saveSeries(int $executionId, int $treatmentPlanExerciseId, array $series): int;

    /**
     * @return array<int, array{weight_value: string|null, weight_unit: string|null, is_bodyweight: bool}|null>
     */
    public function getLastLoads(int $treatmentPlanId, int $patientId, ?int $currentExecutionId = null): array;
}
