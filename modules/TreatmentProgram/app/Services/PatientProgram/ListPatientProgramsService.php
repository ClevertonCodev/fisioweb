<?php

namespace Modules\TreatmentProgram\Services\PatientProgram;

use Modules\TreatmentProgram\Contracts\ListPatientProgramsServiceInterface;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Support\PatientProgramResponseMapper;

class ListPatientProgramsService implements ListPatientProgramsServiceInterface
{
    public function __construct(
        protected PatientProgramRepositoryInterface $patientProgramRepository,
        protected PatientProgramResponseMapper $responseMapper,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function execute(int $patientId, int $clinicId): array
    {
        $plans = $this->patientProgramRepository->listByPatientClinic(
            $patientId,
            $clinicId,
        );

        return $plans->map(fn ($plan) => $this->responseMapper->listItem($plan))->values()->all();
    }
}
