<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanExecutionRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanFeedbackRepositoryInterface;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Models\TreatmentPlanExecution;

class CompletePatientProgramService
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
        protected TreatmentPlanExecutionRepositoryInterface $executionRepository,
        protected TreatmentPlanFeedbackRepositoryInterface $feedbackRepository,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(string $publicToken): array
    {
        $plan      = $this->resolvePlan($publicToken);
        $patientId = (int) $plan->patient_id;

        if ($plan->patient_completed_count > 0) {
            return [
                'already_completed'       => true,
                'patient_completed_count' => (int) $plan->patient_completed_count,
            ];
        }

        $inProgress = $this->executionRepository->findInProgress((int) $plan->id, $patientId);

        if ($this->requiresFeedback($plan) && !$this->feedbackRepository->hasFeedbackForCycle(
            (int) $plan->id,
            $patientId,
            $inProgress?->id,
        )) {
            throw ValidationException::withMessages([
                'feedback' => ['Envie o feedback antes de concluir o programa.'],
            ]);
        }

        return DB::transaction(function () use ($plan, $inProgress) {
            $plan->refresh();

            if ($plan->patient_completed_count > 0) {
                return [
                    'already_completed'       => true,
                    'patient_completed_count' => (int) $plan->patient_completed_count,
                ];
            }

            $completedAt = now();

            if (!is_null($inProgress)) {
                $this->executionRepository->update((int) $inProgress->id, [
                    'status'       => TreatmentPlanExecution::STATUS_COMPLETED,
                    'completed_at' => $completedAt,
                ]);
            }

            $plan->patient_completed_count = 1;
            $plan->save();

            return [
                'already_completed'       => false,
                'patient_completed_count' => 1,
                'completed_at'            => $completedAt->toIso8601String(),
            ];
        });
    }

    private function requiresFeedback(TreatmentPlan $plan): bool
    {
        return $plan->outcome_pain_enabled
            || $plan->outcome_difficulty_enabled
            || $plan->outcome_satisfaction_enabled;
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
