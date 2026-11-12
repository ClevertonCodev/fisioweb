<?php

namespace Modules\ClinicalRecord\Contracts;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Modules\ClinicalRecord\Models\PatientFile;

interface PatientFileServiceInterface
{
    public function listByPatient(int $clinicId, int $patientId): Collection;

    public function findForClinicPatient(int $clinicId, int $patientId, int $fileId): PatientFile;

    /**
     * @return array{url: string, expires_at: string}
     */
    public function signedUrl(PatientFile $file): array;

    /**
     * @return list<array{file_id: int, url: string, expires_at: string}>
     */
    public function imagePreviews(int $clinicId, int $patientId): array;

    public function store(int $clinicId, int $patientId, int $clinicUserId, UploadedFile $upload, ?string $name = null): PatientFile;

    public function destroy(PatientFile $file): void;
}
