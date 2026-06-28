<?php

namespace Modules\ClinicalRecord\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Models\Assessment;

interface AssessmentServiceInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function findForClinic(int $id, int $clinicId): Assessment;

    public function create(array $dto, int $clinicId, int $patientId, int $clinicUserId): Assessment;

    public function update(Assessment $assessment, array $dto): Assessment;

    public function sign(Assessment $assessment, int $clinicUserId): Assessment;

    public function destroy(Assessment $assessment): void;
}
