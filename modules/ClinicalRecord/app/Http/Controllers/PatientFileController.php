<?php

namespace Modules\ClinicalRecord\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Modules\ClinicalRecord\Contracts\PatientFileServiceInterface;
use Modules\ClinicalRecord\Http\Requests\StorePatientFileRequest;
use Modules\ClinicalRecord\Models\PatientFile;
use Modules\Patient\Contracts\PatientServiceInterface;

class PatientFileController extends ClinicAuthenticatedController
{
    public function __construct(
        protected PatientFileServiceInterface $patientFileService,
        protected PatientServiceInterface $patientService,
    ) {}

    public function index(int $patient): JsonResponse
    {
        $clinicId = $this->clinicId();

        if (!$this->isClinicPatient($clinicId, $patient)) {
            return $this->patientNotFound();
        }

        $this->authorize('viewAny', PatientFile::class);

        $files = $this->patientFileService->listByPatient($clinicId, $patient);

        return response()->json(['data' => $files]);
    }

    public function store(StorePatientFileRequest $request, int $patient): JsonResponse
    {
        $clinicId = $this->clinicId();

        if (!$this->isClinicPatient($clinicId, $patient)) {
            return $this->patientNotFound();
        }

        $file = $this->patientFileService->store(
            $clinicId,
            $patient,
            $this->clinicUserId(),
            $request->file('file'),
            $request->input('name'),
        );

        return response()->json(['data' => $file], 201);
    }

    public function previews(int $patient): JsonResponse
    {
        $clinicId = $this->clinicId();

        if (!$this->isClinicPatient($clinicId, $patient)) {
            return $this->patientNotFound();
        }

        $this->authorize('viewAny', PatientFile::class);

        return response()->json(['data' => $this->patientFileService->imagePreviews($clinicId, $patient)]);
    }

    public function signedUrl(int $patient, int $file): JsonResponse
    {
        $clinicId = $this->clinicId();

        if (!$this->isClinicPatient($clinicId, $patient)) {
            return $this->patientNotFound();
        }

        try {
            $patientFile = $this->patientFileService->findForClinicPatient($clinicId, $patient, $file);
        } catch (ModelNotFoundException) {
            return $this->fileNotFound();
        }

        $this->authorize('view', $patientFile);

        return response()->json(['data' => $this->patientFileService->signedUrl($patientFile)]);
    }

    public function destroy(int $patient, int $file): JsonResponse
    {
        $clinicId = $this->clinicId();

        if (!$this->isClinicPatient($clinicId, $patient)) {
            return $this->patientNotFound();
        }

        try {
            $patientFile = $this->patientFileService->findForClinicPatient($clinicId, $patient, $file);
        } catch (ModelNotFoundException) {
            return $this->fileNotFound();
        }

        $this->authorize('delete', $patientFile);
        $this->patientFileService->destroy($patientFile);

        return response()->json(['message' => 'Arquivo removido com sucesso.']);
    }

    private function isClinicPatient(int $clinicId, int $patient): bool
    {
        $found = $this->patientService->find($patient);

        return $found && (int) $found->clinic_id === $clinicId;
    }

    private function patientNotFound(): JsonResponse
    {
        return response()->json(['message' => 'Paciente não encontrado.'], 404);
    }

    private function fileNotFound(): JsonResponse
    {
        return response()->json(['message' => 'Arquivo não encontrado.'], 404);
    }
}
