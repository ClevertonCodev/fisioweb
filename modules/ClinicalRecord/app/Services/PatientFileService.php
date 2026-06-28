<?php

namespace Modules\ClinicalRecord\Services;

use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\ClinicalRecord\Contracts\PatientFileRepositoryInterface;
use Modules\ClinicalRecord\Contracts\PatientFileServiceInterface;
use Modules\ClinicalRecord\Events\PatientFileAttached;
use Modules\ClinicalRecord\Events\PatientFileDeleted;
use Modules\ClinicalRecord\Models\PatientFile;

class PatientFileService implements PatientFileServiceInterface
{
    private const EVENT_VERSION = 1;

    public function __construct(
        protected PatientFileRepositoryInterface $repository,
    ) {}

    public function listByPatient(int $clinicId, int $patientId): Collection
    {
        return $this->repository->listByPatient($clinicId, $patientId);
    }

    public function findForClinicPatient(int $clinicId, int $patientId, int $fileId): PatientFile
    {
        return $this->repository->findForClinicPatient($clinicId, $patientId, $fileId);
    }

    public function store(int $clinicId, int $patientId, int $clinicUserId, array $uploadResult, ?string $name = null): PatientFile
    {
        $file = $this->repository->create([
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

        $this->dispatchEvent(new PatientFileAttached(
            self::EVENT_VERSION,
            (int) $file->id,
            (int) $file->clinic_id,
            (int) $file->patient_id,
            !is_null($file->clinic_user_id) ? (int) $file->clinic_user_id : null,
            Auth::guard('clinic')->id(),
            (string) $file->original_name,
            $file->name,
            (string) $file->mime_type,
            (int) $file->size,
            CarbonImmutable::now(),
        ));

        return $file;
    }

    public function destroy(PatientFile $file): void
    {
        $this->repository->delete($file);

        $this->dispatchEvent(new PatientFileDeleted(
            self::EVENT_VERSION,
            (int) $file->id,
            (int) $file->clinic_id,
            (int) $file->patient_id,
            Auth::guard('clinic')->id(),
            CarbonImmutable::now(),
        ));
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
