<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanExecutionRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanFeedbackRepositoryInterface;
use Modules\TreatmentProgram\DTOs\PatientProgram\SubmitPatientProgramFeedbackData;
use Modules\TreatmentProgram\Models\TreatmentPlan;

class SubmitPatientProgramFeedbackService
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
        protected TreatmentPlanExecutionRepositoryInterface $executionRepository,
        protected TreatmentPlanFeedbackRepositoryInterface $feedbackRepository,
    ) {}

    /**
     * @return array{id: int, submitted_at: string}
     */
    public function execute(string $publicToken, SubmitPatientProgramFeedbackData $data): array
    {
        $plan      = $this->resolvePlan($publicToken);
        $patientId = (int) $plan->patient_id;

        $this->validateOutcomeFlags($plan, $data);
        $this->validateRequiredFields($plan, $data);

        $executionId = $data->executionId;
        if (!is_null($executionId)) {
            $execution = $this->executionRepository->findForPatient(
                $executionId,
                (int) $plan->id,
                $patientId,
            );

            if (is_null($execution)) {
                throw new ModelNotFoundException('Execução não encontrada.');
            }
        }

        $feedback = $this->feedbackRepository->create([
            'clinic_id'          => (int) $plan->clinic_id,
            'treatment_plan_id'  => (int) $plan->id,
            'patient_id'         => $patientId,
            'execution_id'       => $executionId,
            'pain'               => $data->pain,
            'pain_notes'         => $data->painNotes,
            'difficulty'         => $data->difficulty,
            'difficulty_notes'   => $data->difficultyNotes,
            'satisfaction'       => $data->rating,
            'satisfaction_notes' => $data->ratingNotes,
            'submitted_at'       => now(),
        ]);

        return [
            'id'           => (int) $feedback->id,
            'submitted_at' => $feedback->submitted_at->toIso8601String(),
        ];
    }

    private function validateOutcomeFlags(TreatmentPlan $plan, SubmitPatientProgramFeedbackData $data): void
    {
        $errors = [];

        if (!$plan->outcome_pain_enabled && (!is_null($data->pain) || !empty($data->painNotes))) {
            $errors['pain'] = ['A dimensão de dor não está habilitada para este programa.'];
        }

        if (!$plan->outcome_difficulty_enabled && (!is_null($data->difficulty) || !empty($data->difficultyNotes))) {
            $errors['difficulty'] = ['A dimensão de dificuldade não está habilitada para este programa.'];
        }

        if (!$plan->outcome_satisfaction_enabled && (!is_null($data->rating) || !empty($data->ratingNotes))) {
            $errors['rating'] = ['A dimensão de satisfação não está habilitada para este programa.'];
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function validateRequiredFields(TreatmentPlan $plan, SubmitPatientProgramFeedbackData $data): void
    {
        $errors = [];

        if ($plan->outcome_pain_enabled && is_null($data->pain)) {
            $errors['pain'] = ['Informe o nível de dor.'];
        }

        if ($plan->outcome_difficulty_enabled && is_null($data->difficulty)) {
            $errors['difficulty'] = ['Informe o nível de dificuldade.'];
        }

        if ($plan->outcome_satisfaction_enabled && empty($data->rating)) {
            $errors['rating'] = ['Informe a satisfação.'];
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
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
