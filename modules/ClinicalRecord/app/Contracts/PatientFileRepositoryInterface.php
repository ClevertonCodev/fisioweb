<?php

namespace Modules\ClinicalRecord\Contracts;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Models\PatientFile;

interface PatientFileRepositoryInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function findForClinicPatient(int $clinicId, int $patientId, int $fileId): PatientFile;

    public function create(array $data): PatientFile;

    public function delete(PatientFile $file): void;
}
