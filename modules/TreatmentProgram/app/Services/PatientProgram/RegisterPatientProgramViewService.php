<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;

class RegisterPatientProgramViewService
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
    ) {}

    /**
     * @return array{viewed: bool}
     */
    public function execute(string $publicToken): array
    {
        $plan = $this->patientProgramRepository->findByPublicToken($publicToken);

        if (is_null($plan)) {
            throw new ModelNotFoundException('Programa não encontrado.');
        }

        if (is_null($plan->patient_viewed_at)) {
            $plan->patient_viewed_at = now();
            $plan->save();
        }

        return ['viewed' => true];
    }
}
