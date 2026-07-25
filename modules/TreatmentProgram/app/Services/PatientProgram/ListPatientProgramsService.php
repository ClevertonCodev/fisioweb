<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Support\PatientProgramResponseMapper;

class ListPatientProgramsService
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
        protected PatientProgramResponseMapper $responseMapper,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function execute(Patient $patient): array
    {
        $plans = $this->patientProgramRepository->listByPatientClinic(
            (int) $patient->id,
            (int) $patient->clinic_id,
        );

        return $plans->map(fn ($plan) => $this->responseMapper->listItem($plan))->values()->all();
    }
}
