<?php

namespace Modules\ClinicalRecord\Repositories;

use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Contracts\PatientFileRepositoryInterface;
use Modules\ClinicalRecord\Models\PatientFile;

class PatientFileRepository implements PatientFileRepositoryInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection
    {
        return PatientFile::query()
            ->forClinic($clinicId)
            ->where('patient_id', $patientId)
            ->with('clinicUser')
            ->latest()
            ->get();
    }

    public function findForClinicPatient(int $clinicId, int $patientId, int $fileId): PatientFile
    {
        return PatientFile::query()
            ->forClinic($clinicId)
            ->where('patient_id', $patientId)
            ->findOrFail($fileId);
    }

    public function create(array $data): PatientFile
    {
        return PatientFile::query()->create($data);
    }

    public function delete(PatientFile $file): void
    {
        $file->delete();
    }
}
