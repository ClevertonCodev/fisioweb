<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Http\Requests\StorePatientFileRequest;
use Modules\Clinic\Models\PatientFile;
use Modules\Clinic\Services\PatientFileService;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Patient\Models\Patient;

class PatientFileController extends Controller
{
    public function __construct(
        protected PatientFileService $patientFileService,
        protected FileServiceInterface $fileService,
    ) {}

    public function index(Patient $patient): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        if ($patient->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $files = $this->patientFileService->listByPatient($clinicId, $patient->id);

        return response()->json(['data' => $files]);
    }

    public function store(StorePatientFileRequest $request, Patient $patient): JsonResponse
    {
        $clinicUser = Auth::guard('clinic')->user();

        if ($patient->clinic_id !== $clinicUser->clinic_id) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $uploaded = $this->fileService->uploadFile($request->file('file'), 'patients/files');

        $file = $this->patientFileService->store(
            $clinicUser->clinic_id,
            $patient->id,
            $clinicUser->id,
            $uploaded,
            $request->input('name'),
        );

        return response()->json(['data' => $file], 201);
    }

    public function destroy(Patient $patient, PatientFile $file): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        if ($patient->clinic_id !== $clinicId || $file->clinic_id !== $clinicId || $file->patient_id !== $patient->id) {
            return response()->json(['message' => 'Arquivo não encontrado.'], 404);
        }

        $this->authorize('delete', $file);

        $this->patientFileService->destroy($file);

        return response()->json(['message' => 'Arquivo removido com sucesso.']);
    }
}
