<?php

namespace Modules\TreatmentProgram\Contracts;

use Illuminate\Support\Collection;
use Modules\TreatmentProgram\Models\TreatmentPlan;

interface PatientProgramRepositoryInterface
{
    public function findByPublicToken(string $publicToken): ?TreatmentPlan;

    public function findOwnedByPublicToken(string $publicToken, int $clinicId, int $patientId): ?TreatmentPlan;

    /**
     * @return Collection<int, TreatmentPlan>
     */
    public function listByPatientClinic(int $patientId, int $clinicId): Collection;
}
