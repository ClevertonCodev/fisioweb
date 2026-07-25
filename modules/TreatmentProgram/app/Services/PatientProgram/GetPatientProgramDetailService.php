<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanExecutionRepositoryInterface;
use Modules\TreatmentProgram\Support\PatientProgramResponseMapper;

class GetPatientProgramDetailService
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
        protected TreatmentPlanExecutionRepositoryInterface $executionRepository,
        protected PatientProgramResponseMapper $responseMapper,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function execute(string $publicToken): array
    {
        $plan = $this->patientProgramRepository->findByPublicToken($publicToken);

        if (is_null($plan)) {
            throw new ModelNotFoundException('Programa não encontrado.');
        }

        $currentExecution = null;
        $lastLoads        = [];

        if (!is_null($plan->patient_id)) {
            $patientId        = (int) $plan->patient_id;
            $currentExecution = $this->executionRepository->findInProgress((int) $plan->id, $patientId);
            $lastLoads        = $this->executionRepository->getLastLoads(
                (int) $plan->id,
                $patientId,
                $currentExecution?->id,
            );
        }

        return $this->responseMapper->detail($plan, $currentExecution, $lastLoads);
    }
}
