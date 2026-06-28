<?php

namespace Modules\ClinicalRecord\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Models\PatientFile;

interface PatientFileServiceInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function findForClinicPatient(int $clinicId, int $patientId, int $fileId): PatientFile;

    public function store(int $clinicId, int $patientId, int $clinicUserId, array $uploadResult, ?string $name = null): PatientFile;

    public function destroy(PatientFile $file): void;
}
