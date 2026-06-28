<?php

namespace Modules\ClinicalRecord\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Modules\ClinicalRecord\Contracts\PatientFileServiceInterface;
use Modules\ClinicalRecord\Http\Requests\StorePatientFileRequest;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Patient\Contracts\PatientServiceInterface;

class PatientFileController extends Controller
{
    public function __construct(
        protected PatientFileServiceInterface $patientFileService,
        protected FileServiceInterface $fileService,
        protected PatientServiceInterface $patientService,
    ) {}

    public function index(int $patient): JsonResponse
    {
        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $files = $this->patientFileService->listByPatient($clinicId, $patient);

        return response()->json(['data' => $files]);
    }

    public function store(StorePatientFileRequest $request, int $patient): JsonResponse
    {
        $clinicUser = Auth::guard('clinic')->user();
        $found      = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== (int) $clinicUser->clinic_id) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $uploaded = $this->fileService->uploadFile($request->file('file'), 'patients/files');

        $file = $this->patientFileService->store(
            (int) $clinicUser->clinic_id,
            $patient,
            (int) $clinicUser->id,
            $uploaded,
            $request->input('name'),
        );

        return response()->json(['data' => $file], 201);
    }

    public function destroy(int $patient, int $file): JsonResponse
    {
        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
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
