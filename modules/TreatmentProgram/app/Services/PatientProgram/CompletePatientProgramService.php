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

        $inProgress = $this->executionRepository->findInProgress((int) $plan->id, $patientId);

        if (is_null($inProgress)) {
            if (!$this->requiresFeedback($plan)) {
                return $this->completeWithoutExecution($plan);
            }

            if ($this->feedbackRepository->hasFeedbackForCycle(
                (int) $plan->id,
                $patientId,
                null,
            )) {
                return $this->completeManualFeedbackCycle($plan);
            }

            if ($plan->patient_completed_count > 0) {
                return [
                    'already_completed'       => true,
                    'patient_completed_count' => (int) $plan->patient_completed_count,
                ];
            }

            throw ValidationException::withMessages([
                'feedback' => ['Envie o feedback antes de concluir o programa.'],
            ]);
        }

        return $this->finalizeExecution($plan, $inProgress);
    }

    /**
     * Conclusão via atalho de feedback sem execução iniciada (primeira vez).
     *
     * @return array<string, mixed>
     */
    private function completeManualFeedbackCycle(TreatmentPlan $plan): array
    {
        return DB::transaction(function () use ($plan) {
            $plan->refresh();

            if ($plan->patient_completed_count > 0) {
                return [
                    'already_completed'       => true,
                    'patient_completed_count' => (int) $plan->patient_completed_count,
                ];
            }

            $completedAt = now();

            $plan->patient_completed_count = 1;
            $plan->save();

            return [
                'already_completed'       => false,
                'patient_completed_count' => 1,
                'completed_at'            => $completedAt->toIso8601String(),
            ];
        });
    }

    /**
     * Atalho sem execução — só na primeira conclusão de programas sem feedback.
     *
     * @return array<string, mixed>
     */
    private function completeWithoutExecution(TreatmentPlan $plan): array
    {
        return DB::transaction(function () use ($plan) {
            $plan->refresh();

            if ($plan->patient_completed_count > 0) {
                return [
                    'already_completed'       => true,
                    'patient_completed_count' => (int) $plan->patient_completed_count,
                ];
            }

            $completedAt = now();

            $plan->patient_completed_count = 1;
            $plan->save();

            return [
                'already_completed'       => false,
                'patient_completed_count' => 1,
                'completed_at'            => $completedAt->toIso8601String(),
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function finalizeExecution(
        TreatmentPlan $plan,
        TreatmentPlanExecution $execution,
    ): array {
        return DB::transaction(function () use ($plan, $execution) {
            $plan->refresh();
            $execution->refresh();

            if ($execution->status === TreatmentPlanExecution::STATUS_COMPLETED) {
                return [
                    'already_completed'       => true,
                    'patient_completed_count' => (int) $plan->patient_completed_count,
                ];
            }

            $completedAt = now();

            $this->executionRepository->update((int) $execution->id, [
                'status'       => TreatmentPlanExecution::STATUS_COMPLETED,
                'completed_at' => $completedAt,
            ]);

            $plan->patient_completed_count = (int) $plan->patient_completed_count + 1;
            $plan->save();

            return [
                'already_completed'       => false,
                'patient_completed_count' => (int) $plan->patient_completed_count,
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
