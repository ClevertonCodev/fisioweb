<?php

namespace Modules\TreatmentProgram\Repositories;

use Modules\TreatmentProgram\Contracts\TreatmentPlanFeedbackRepositoryInterface;
use Modules\TreatmentProgram\Models\TreatmentPlanFeedback;

class EloquentTreatmentPlanFeedbackRepository implements TreatmentPlanFeedbackRepositoryInterface
{
    public function __construct(
        protected TreatmentPlanFeedback $model,
    ) {}

    public function create(array $data): TreatmentPlanFeedback
    {
        return $this->model->create($data);
    }

    public function hasFeedbackForCycle(int $treatmentPlanId, int $patientId, ?int $executionId): bool
    {
        $query = $this->model->newQuery()
            ->where('treatment_plan_id', $treatmentPlanId)
            ->where('patient_id', $patientId);

        if (!is_null($executionId)) {
            // Aceita feedback ligado à execução ou "concluir manualmente" sem execution_id
            $query->where(function ($q) use ($executionId) {
                $q->where('execution_id', $executionId)
                    ->orWhereNull('execution_id');
            });
        }

        return $query->exists();
    }
}
