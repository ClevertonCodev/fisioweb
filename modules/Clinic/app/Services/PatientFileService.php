<?php

namespace Modules\Clinic\Services;

use Illuminate\Support\Collection;
use Modules\Clinic\Models\PatientFile;

class PatientFileService
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

    public function store(int $clinicId, int $patientId, int $clinicUserId, array $uploadResult, ?string $name = null): PatientFile
    {
        return PatientFile::create([
            'clinic_id'      => $clinicId,
            'patient_id'     => $patientId,
            'clinic_user_id' => $clinicUserId,
            'original_name'  => $uploadResult['original_filename'],
            'name'           => $name,
            'file_path'      => $uploadResult['path'],
            'cdn_url'        => $uploadResult['cdn_url'],
            'mime_type'      => $uploadResult['mime_type'],
            'size'           => $uploadResult['size'],
        ]);
    }

    public function destroy(PatientFile $file): void
    {
        $file->delete();
    }
}
