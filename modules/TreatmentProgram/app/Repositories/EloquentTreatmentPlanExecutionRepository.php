<?php

namespace Modules\TreatmentProgram\Repositories;

use Modules\TreatmentProgram\Contracts\TreatmentPlanExecutionRepositoryInterface;
use Modules\TreatmentProgram\Models\TreatmentPlanExecution;
use Modules\TreatmentProgram\Models\TreatmentPlanExecutionSeries;
use Modules\TreatmentProgram\Models\TreatmentPlanExercise;

class EloquentTreatmentPlanExecutionRepository implements TreatmentPlanExecutionRepositoryInterface
{
    public function __construct(
        protected TreatmentPlanExecution $model,
        protected TreatmentPlanExecutionSeries $seriesModel,
    ) {}

    public function findInProgress(int $treatmentPlanId, int $patientId): ?TreatmentPlanExecution
    {
        return $this->model->newQuery()
            ->where('treatment_plan_id', $treatmentPlanId)
            ->where('patient_id', $patientId)
            ->where('status', TreatmentPlanExecution::STATUS_IN_PROGRESS)
            ->first();
    }

    public function findForPatient(int $executionId, int $treatmentPlanId, int $patientId): ?TreatmentPlanExecution
    {
        return $this->model->newQuery()
            ->where('id', $executionId)
            ->where('treatment_plan_id', $treatmentPlanId)
            ->where('patient_id', $patientId)
            ->first();
    }

    public function create(array $data): TreatmentPlanExecution
    {
        return $this->model->create($data);
    }

    public function update(int $executionId, array $data): TreatmentPlanExecution
    {
        $execution = $this->model->findOrFail($executionId);
        $execution->update($data);

        return $execution->fresh();
    }

    public function saveSeries(int $executionId, int $treatmentPlanExerciseId, array $series): int
    {
        $nextIndex = (int) $this->seriesModel->newQuery()
            ->where('execution_id', $executionId)
            ->where('treatment_plan_exercise_id', $treatmentPlanExerciseId)
            ->max('series_index');

        $saved = 0;

        foreach ($series as $item) {
            $nextIndex++;
            $isBodyweight = (bool) ($item['is_bodyweight'] ?? false);

            $this->seriesModel->create([
                'execution_id'               => $executionId,
                'treatment_plan_exercise_id' => $treatmentPlanExerciseId,
                'series_index'               => $nextIndex,
                'count'                      => $item['count'] ?? null,
                'weight_value'               => $isBodyweight ? null : ($item['weight_value'] ?? null),
                'weight_unit'                => $isBodyweight ? null : ($item['weight_unit'] ?? null),
                'is_bodyweight'              => $isBodyweight,
            ]);
            $saved++;
        }

        return $saved;
    }

    public function getLastLoads(int $treatmentPlanId, int $patientId, ?int $currentExecutionId = null): array
    {
        $exerciseIds = TreatmentPlanExercise::query()
            ->where('treatment_plan_id', $treatmentPlanId)
            ->pluck('id');

        if ($exerciseIds->isEmpty()) {
            return [];
        }

        $loads = [];

        foreach ($exerciseIds as $exerciseId) {
            $loads[(int) $exerciseId] = $this->resolveLastLoad(
                (int) $exerciseId,
                $treatmentPlanId,
                $patientId,
                $currentExecutionId,
            );
        }

        return $loads;
    }

    /**
     * @return array{weight_value: string|null, weight_unit: string|null, is_bodyweight: bool}|null
     */
    private function resolveLastLoad(
        int $treatmentPlanExerciseId,
        int $treatmentPlanId,
        int $patientId,
        ?int $currentExecutionId,
    ): ?array {
        if (!is_null($currentExecutionId)) {
            $series = $this->latestSeriesForExercise($currentExecutionId, $treatmentPlanExerciseId);
            if (!is_null($series)) {
                return $this->mapSeriesLoad($series);
            }
        }

        $completedExecutionIds = $this->model->newQuery()
            ->where('treatment_plan_id', $treatmentPlanId)
            ->where('patient_id', $patientId)
            ->where('status', TreatmentPlanExecution::STATUS_COMPLETED)
            ->orderByDesc('completed_at')
            ->pluck('id');

        foreach ($completedExecutionIds as $executionId) {
            $series = $this->latestSeriesForExercise((int) $executionId, $treatmentPlanExerciseId);
            if (!is_null($series)) {
                return $this->mapSeriesLoad($series);
            }
        }

        return null;
    }

    private function latestSeriesForExercise(int $executionId, int $treatmentPlanExerciseId): ?TreatmentPlanExecutionSeries
    {
        return $this->seriesModel->newQuery()
            ->where('execution_id', $executionId)
            ->where('treatment_plan_exercise_id', $treatmentPlanExerciseId)
            ->orderByDesc('id')
            ->first();
    }

    /**
     * @return array{weight_value: string|null, weight_unit: string|null, is_bodyweight: bool}
     */
    private function mapSeriesLoad(TreatmentPlanExecutionSeries $series): array
    {
        return [
            'weight_value'  => $series->weight_value,
            'weight_unit'   => $series->weight_unit,
            'is_bodyweight' => (bool) $series->is_bodyweight,
        ];
    }
}
