<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanExecutionRepositoryInterface;
use Modules\TreatmentProgram\DTOs\PatientProgram\SavePatientProgramSeriesData;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanExecution;
use Modules\TreatmentProgram\Models\TreatmentPlanExercise;

class SavePatientProgramSeriesService
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
        protected TreatmentPlanExecutionRepositoryInterface $executionRepository,
    ) {}

    /**
     * @return array{execution_id: int, exercise_id: int, series_count: int}
     */
    public function execute(
        string $publicToken,
        int $executionId,
        SavePatientProgramSeriesData $data,
    ): array {
        $plan      = $this->resolvePlan($publicToken);
        $execution = $this->resolveExecution($executionId, $plan);

        if ($execution->status !== TreatmentPlanExecution::STATUS_IN_PROGRESS) {
            throw ValidationException::withMessages([
                'execution' => ['Esta execução não está em andamento.'],
            ]);
        }

        $belongsToPlan = TreatmentPlanExercise::query()
            ->where('id', $data->exerciseId)
            ->where('treatment_plan_id', $plan->id)
            ->exists();

        if (!$belongsToPlan) {
            throw ValidationException::withMessages([
                'exercise_id' => ['Exercício não pertence a este programa.'],
            ]);
        }

        $seriesItems = array_map(fn ($item) => $item->toArray(), $data->series);
        $savedCount  = $this->executionRepository->saveSeries(
            (int) $execution->id,
            $data->exerciseId,
            $seriesItems,
        );

        return [
            'execution_id' => (int) $execution->id,
            'exercise_id'  => $data->exerciseId,
            'series_count' => $savedCount,
        ];
    }

    private function resolvePlan(string $publicToken): TreatmentPlan
    {
        $plan = $this->patientProgramRepository->findByPublicToken($publicToken);

        if (is_null($plan) || is_null($plan->patient_id)) {
            throw new ModelNotFoundException('Programa não encontrado.');
        }

        return $plan;
    }

    private function resolveExecution(int $executionId, TreatmentPlan $plan): TreatmentPlanExecution
    {
        $execution = $this->executionRepository->findForPatient(
            $executionId,
            (int) $plan->id,
            (int) $plan->patient_id,
        );

        if (is_null($execution)) {
            throw new ModelNotFoundException('Execução não encontrada.');
        }

        return $execution;
    }
}
