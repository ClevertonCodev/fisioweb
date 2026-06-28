<?php

namespace Modules\ClinicalRecord\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Modules\ClinicalRecord\Contracts\AssessmentServiceInterface;
use Modules\ClinicalRecord\Http\Requests\StoreAssessmentRequest;
use Modules\ClinicalRecord\Http\Requests\UpdateAssessmentRequest;
use Modules\ClinicalRecord\Models\Assessment;
use Modules\Patient\Contracts\PatientServiceInterface;

class AssessmentController extends Controller
{
    public function __construct(
        protected AssessmentServiceInterface $assessmentService,
        protected PatientServiceInterface $patientService,
    ) {}

    public function indexByPatient(int $patient): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $data = $this->assessmentService->listByPatient((int) $clinicId, $patient);

        return response()->json(['data' => $data]);
    }

    public function storeForPatient(StoreAssessmentRequest $request, int $patient): JsonResponse
    {
        $this->authorize('create', Assessment::class);

        $clinicUser = Auth::guard('clinic')->user();
        $clinicId   = $clinicUser->clinic_id;
        $found      = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $assessment = $this->assessmentService->create(
            $request->validated(),
            (int) $clinicId,
            $patient,
            (int) $clinicUser->id,
        );

        return response()->json(['data' => $assessment], 201);
    }

    public function show(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $assessment = $this->assessmentService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Avaliação não encontrada.'], 404);
        }

        return response()->json(['data' => $assessment]);
    }

    public function update(UpdateAssessmentRequest $request, int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $assessment = $this->assessmentService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Avaliação não encontrada.'], 404);
        }

        $this->authorize('update', $assessment);

        $assessment = $this->assessmentService->update($assessment, $request->validated());

        return response()->json(['data' => $assessment]);
    }

    public function sign(int $id): JsonResponse
    {
        $clinicUser = Auth::guard('clinic')->user();
        $clinicId   = $clinicUser->clinic_id;

        try {
            $assessment = $this->assessmentService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Avaliação não encontrada.'], 404);
        }

        $this->authorize('sign', $assessment);

        $assessment = $this->assessmentService->sign($assessment, (int) $clinicUser->id);

        return response()->json(['data' => $assessment]);
    }

    public function destroy(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $assessment = $this->assessmentService->findForClinic($id, (int) $clinicId);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Avaliação não encontrada.'], 404);
        }

        $this->authorize('delete', $assessment);

        $this->assessmentService->destroy($assessment);

        return response()->json(['message' => 'Avaliação removida com sucesso.']);
    }
}
