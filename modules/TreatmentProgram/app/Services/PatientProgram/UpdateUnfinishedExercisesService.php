<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanExecutionRepositoryInterface;
use Modules\TreatmentProgram\DTOs\PatientProgram\UpdateUnfinishedExercisesData;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanExecution;
use Modules\TreatmentProgram\Models\TreatmentPlanExercise;

class UpdateUnfinishedExercisesService
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
        protected TreatmentPlanExecutionRepositoryInterface $executionRepository,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(
        string $publicToken,
        int $executionId,
        UpdateUnfinishedExercisesData $data,
    ): array {
        $plan      = $this->resolvePlan($publicToken);
        $execution = $this->resolveExecution($executionId, $plan);

        if ($execution->status !== TreatmentPlanExecution::STATUS_IN_PROGRESS) {
            throw ValidationException::withMessages([
                'execution' => ['Esta execução não está em andamento.'],
            ]);
        }

        $validIds = TreatmentPlanExercise::query()
            ->where('treatment_plan_id', $plan->id)
            ->whereIn('id', $data->unfinishedExerciseIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (count($validIds) !== count($data->unfinishedExerciseIds)) {
            throw ValidationException::withMessages([
                'unfinished_exercise_ids' => ['Um ou mais exercícios são inválidos para este programa.'],
            ]);
        }

        $updated = $this->executionRepository->update((int) $execution->id, [
            'unfinished_exercise_ids' => $validIds,
        ]);

        return [
            'id'                      => $updated->id,
            'status'                  => $updated->status,
            'unfinished_exercise_ids' => $updated->unfinished_exercise_ids ?? [],
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
