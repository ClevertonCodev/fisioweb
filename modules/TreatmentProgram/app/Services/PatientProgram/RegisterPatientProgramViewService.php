<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Modules\Patient\Contracts\Public\PatientAppAccessInterface;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Contracts\RegisterPatientProgramViewServiceInterface;

class RegisterPatientProgramViewService implements RegisterPatientProgramViewServiceInterface
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
        protected PatientAppAccessInterface $patientAppAccess,
    ) {}

    /**
     * @return array{viewed: bool}
     */
    public function execute(string $publicToken): array
    {
        $plan = $this->patientProgramRepository->findByPublicToken($publicToken);

        if (is_null($plan) || (!is_null($plan->patient_id) && !$this->patientAppAccess->allowsAppAccess((int) $plan->patient_id))) {
            throw new ModelNotFoundException('Programa não encontrado.');
        }

        if (is_null($plan->patient_viewed_at)) {
            $plan->patient_viewed_at = now();
            $plan->save();
        }

        return ['viewed' => true];
    }
}
