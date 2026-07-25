<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanExecutionRepositoryInterface;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanExecution;
use Modules\TreatmentProgram\Support\PatientProgramStatusMapper;

class StartOrResumePatientProgramExecutionService
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
        protected TreatmentPlanExecutionRepositoryInterface $executionRepository,
        protected PatientProgramStatusMapper $statusMapper,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(string $publicToken): array
    {
        $plan      = $this->resolvePlan($publicToken);
        $patientId = (int) $plan->patient_id;

        if (!$this->statusMapper->allowsStart($plan)) {
            throw ValidationException::withMessages([
                'program' => ['Este programa não está disponível para execução.'],
            ]);
        }

        $existing = $this->executionRepository->findInProgress((int) $plan->id, $patientId);

        if (!is_null($existing)) {
            return $this->executionPayload($existing, true, (int) $plan->id, $patientId);
        }

        $execution = DB::transaction(function () use ($plan, $patientId) {
            $inProgress = $this->executionRepository->findInProgress((int) $plan->id, $patientId);
            if (!is_null($inProgress)) {
                return $inProgress;
            }

            return $this->executionRepository->create([
                'clinic_id'               => (int) $plan->clinic_id,
                'treatment_plan_id'       => (int) $plan->id,
                'patient_id'              => $patientId,
                'status'                  => TreatmentPlanExecution::STATUS_IN_PROGRESS,
                'unfinished_exercise_ids' => [],
                'started_at'              => now(),
            ]);
        });

        return $this->executionPayload($execution, false, (int) $plan->id, $patientId);
    }

    /**
     * @return array<string, mixed>
     */
    private function executionPayload(
        TreatmentPlanExecution $execution,
        bool $resumed,
        int $planId,
        int $patientId,
    ): array {
        $lastLoads = $this->executionRepository->getLastLoads($planId, $patientId, (int) $execution->id);

        return [
            'id'                      => $execution->id,
            'status'                  => $execution->status,
            'resumed'                 => $resumed,
            'unfinished_exercise_ids' => $execution->unfinished_exercise_ids ?? [],
            'last_loads'              => $lastLoads,
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
}
