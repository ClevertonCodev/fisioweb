<?php

namespace Modules\ClinicalRecord\Services;

use Carbon\CarbonImmutable;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Modules\ClinicalRecord\Contracts\PatientFileRepositoryInterface;
use Modules\ClinicalRecord\Contracts\PatientFileServiceInterface;
use Modules\ClinicalRecord\Events\PatientFileAttached;
use Modules\ClinicalRecord\Events\PatientFileDeleted;
use Modules\ClinicalRecord\Models\PatientFile;
use Modules\Cloudflare\Contracts\FileServiceInterface;

class PatientFileService implements PatientFileServiceInterface
{
    private const EVENT_VERSION = 1;

    private const DIRECTORY = 'patients/files';

    private const LINK_TTL_SECONDS = 300;

    public function __construct(
        protected PatientFileRepositoryInterface $repository,
        protected FileServiceInterface $files,
    ) {}

    public function listByPatient(int $clinicId, int $patientId): Collection
    {
        return $this->repository->listByPatient($clinicId, $patientId);
    }

    public function findForClinicPatient(int $clinicId, int $patientId, int $fileId): PatientFile
    {
        return $this->repository->findForClinicPatient($clinicId, $patientId, $fileId);
    }

    public function signedUrl(PatientFile $file): array
    {
        $link = $this->files->createPresignedDownloadUrl(
            (string) $file->file_path,
            self::LINK_TTL_SECONDS,
            $this->downloadName((string) $file->original_name, (string) $file->mime_type),
            (string) $file->mime_type,
        );

        return ['url' => $link['url'], 'expires_at' => $link['expires_at']];
    }

    public function imagePreviews(int $clinicId, int $patientId): array
    {
        return $this->repository->listByPatient($clinicId, $patientId)
            ->filter(fn (PatientFile $file) => str_starts_with((string) $file->mime_type, 'image/'))
            ->map(fn (PatientFile $file) => ['file_id' => (int) $file->id] + $this->signedUrl($file))
            ->values()
            ->all();
    }

    public function store(int $clinicId, int $patientId, int $clinicUserId, UploadedFile $upload, ?string $name = null): PatientFile
    {
        $type     = $this->contentTypeOf($upload);
        $uploaded = $this->files->uploadFileAs(
            $upload,
            self::DIRECTORY,
            Str::uuid() . '.' . PatientFile::EXTENSION_BY_MIME[$type],
            $type,
        );

        try {
            $file = $this->repository->create([
                'clinic_id'      => $clinicId,
                'patient_id'     => $patientId,
                'clinic_user_id' => $clinicUserId,
                'original_name'  => $uploaded['original_filename'],
                'name'           => $name,
                'file_path'      => $uploaded['path'],
                'mime_type'      => $uploaded['mime_type'],
                'size'           => $uploaded['size'],
            ]);
        } catch (\Throwable $e) {
            $this->deleteStoredObject($uploaded['path']);

            throw $e;
        }

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
        $path = (string) $file->file_path;

        $this->repository->delete($file);
        DB::afterCommit(fn () => $this->deleteStoredObject($path));

        $this->dispatchEvent(new PatientFileDeleted(
            self::EVENT_VERSION,
            (int) $file->id,
            (int) $file->clinic_id,
            (int) $file->patient_id,
            Auth::guard('clinic')->id(),
            CarbonImmutable::now(),
        ));
    }

    private function downloadName(string $originalName, string $mimeType): string
    {
        $extension = PatientFile::EXTENSION_BY_MIME[$mimeType] ?? null;

        if (is_null($extension)) {
            return $originalName;
        }

        $base = pathinfo($originalName, PATHINFO_FILENAME);

        return (empty($base) ? 'arquivo' : $base) . '.' . $extension;
    }

    private function contentTypeOf(UploadedFile $upload): string
    {
        $type = (string) $upload->getMimeType();

        if (!array_key_exists($type, PatientFile::EXTENSION_BY_MIME)) {
            throw ValidationException::withMessages([
                'file' => 'Tipos permitidos: JPEG, PNG, PDF e DOCX.',
            ]);
        }

        return $type;
    }

    private function deleteStoredObject(string $path): void
    {
        try {
            $this->files->deletePrivateFile($path);
        } catch (\Throwable $e) {
            report($e);
        }
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
