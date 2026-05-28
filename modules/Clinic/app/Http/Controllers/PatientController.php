<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Http\Requests\StorePatientRequest;
use Modules\Clinic\Http\Requests\UpdatePatientRequest;
use Modules\Patient\Models\Patient;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Patient\Contracts\PatientServiceInterface;

class PatientController extends Controller
{
    public function __construct(
        protected PatientServiceInterface $patientService,
        protected FileServiceInterface $fileService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        $filters = array_filter([
            'search'    => $request->string('search')->toString() ?: null,
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : null,
            'statuses'  => $request->filled('statuses')
                ? array_filter(explode(',', $request->string('statuses')->toString()))
                : null,
            'date_from' => $request->string('date_from')->toString() ?: null,
            'date_to'   => $request->string('date_to')->toString() ?: null,
            'page'      => $request->integer('page') ?: null,
        ], fn ($v) => $v !== null);

        $perPage = $request->integer('per_page', 15);
        $data    = $this->patientService->list($clinicId, $filters, $perPage);

        return response()->json(['data' => $data]);
    }

    public function bulkInactivate(Request $request): JsonResponse
    {
        $this->authorize('bulkInactivate', Patient::class);

        $request->validate([
            'ids'   => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
        ]);

        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $count    = $this->patientService->bulkInactivate($clinicId, $request->input('ids'));

        return response()->json([
            'message' => "{$count} paciente(s) inativado(s) com sucesso.",
            'count'   => $count,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $patient  = $this->patientService->find($id);

        if (!$patient || $patient->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        return response()->json(['data' => $patient]);
    }

    public function store(StorePatientRequest $request): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $patient  = $this->patientService->create($request->validated(), $clinicId);

        return response()->json(['data' => $patient], 201);
    }

    public function update(UpdatePatientRequest $request, int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $patient  = $this->patientService->find($id);

        if (!$patient || $patient->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $patient = $this->patientService->update($id, $request->validated());

        return response()->json(['data' => $patient]);
    }

    public function uploadPhoto(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'photo' => ['required', 'file', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $patient  = $this->patientService->find($id);

        if (!$patient || $patient->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $uploaded = $this->fileService->uploadFile($request->file('photo'), 'patients/photos');
        $patient  = $this->patientService->update($id, ['photo_url' => $uploaded['cdn_url']]);

        return response()->json(['data' => $patient]);
    }

    public function destroy(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $patient  = $this->patientService->find($id);

        if (!$patient || $patient->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $this->authorize('delete', $patient);

        $patient->delete();

        return response()->json(['message' => 'Paciente removido com sucesso.']);
    }
}
