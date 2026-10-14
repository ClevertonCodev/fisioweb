<?php

namespace Modules\ClinicalRecord\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Modules\ClinicalRecord\Contracts\PatientFileServiceInterface;
use Modules\ClinicalRecord\Http\Requests\StorePatientFileRequest;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Patient\Contracts\PatientServiceInterface;

class PatientFileController extends ClinicAuthenticatedController
{
    public function __construct(
        protected PatientFileServiceInterface $patientFileService,
        protected FileServiceInterface $fileService,
        protected PatientServiceInterface $patientService,
    ) {}

    public function index(int $patient): JsonResponse
    {
        $clinicId = $this->clinicId();
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $files = $this->patientFileService->listByPatient($clinicId, $patient);

        return response()->json(['data' => $files]);
    }

    public function store(StorePatientFileRequest $request, int $patient): JsonResponse
    {
        $clinicId   = $this->clinicId();
        $found      = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $uploaded = $this->fileService->uploadFile($request->file('file'), 'patients/files');

        $file = $this->patientFileService->store(
            $clinicId,
            $patient,
            $this->clinicUserId(),
            $uploaded,
            $request->input('name'),
        );

        return response()->json(['data' => $file], 201);
    }

    public function destroy(int $patient, int $file): JsonResponse
    {
        $clinicId = $this->clinicId();
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        try {
            $patientFile = $this->patientFileService->findForClinicPatient($clinicId, $patient, $file);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Arquivo não encontrado.'], 404);
        }

        $this->authorize('delete', $patientFile);
        $this->patientFileService->destroy($patientFile);

        return response()->json(['message' => 'Arquivo removido com sucesso.']);
    }
}
