<?php

namespace Modules\TreatmentProgram\Contracts;

interface ListPatientProgramsServiceInterface
{
    /**
     * @return list<array<string, mixed>>
     */
    public function execute(int $patientId, int $clinicId): array;
}
