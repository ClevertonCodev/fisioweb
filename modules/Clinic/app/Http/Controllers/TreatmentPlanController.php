<?php

namespace Modules\Clinic\Http\Controllers;

use App\Helpers\ValidationHelper;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\TreatmentPlanServiceInterface;
use Modules\Clinic\Http\Requests\StoreTreatmentPlanRequest;
use Modules\Clinic\Http\Requests\UpdateTreatmentPlanRequest;
use Modules\Pdf\Services\PdfService;

class TreatmentPlanController extends Controller
{
    public function __construct(
        protected TreatmentPlanServiceInterface $treatmentPlanService,
        protected PdfService $pdfService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $filters  = $request->only(['search', 'status', 'patient_id', 'physio_area_id', 'without_patient']);
        $perPage  = $request->integer('per_page', 15);
        $data     = $this->treatmentPlanService->list($clinicId, $filters, $perPage);

        return response()->json(['data' => $data]);
    }

    public function show(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        try {
            $plan = $this->treatmentPlanService->find($id);
            if ($plan->clinic_id !== (int) $clinicId) {
                return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
            }
            $plan->load([
                'groups.exercises.exercise.videos',
                'exercises.exercise.videos',
                'patient',
                'physioArea',
                'physioSubarea',
            ]);

            return response()->json(['data' => $plan]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
        }
    }

    public function store(StoreTreatmentPlanRequest $request): JsonResponse
    {
        $clinicUser = Auth::guard('clinic')->user();
        $data       = array_merge($request->validated(), [
            'clinic_id'      => $clinicUser->clinic_id,
            'clinic_user_id' => $clinicUser->id,
        ]);
        $plan = $this->treatmentPlanService->create($data);

        return response()->json(['data' => $plan], 201);
    }

    public function update(UpdateTreatmentPlanRequest $request, int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        try {
            $plan = $this->treatmentPlanService->find($id);
            if ($plan->clinic_id !== (int) $clinicId) {
                return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
            }
            $plan = $this->treatmentPlanService->update($id, $request->validated());

            return response()->json(['data' => $plan]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        try {
            $plan = $this->treatmentPlanService->find($id);
            if ($plan->clinic_id !== (int) $clinicId) {
                return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
            }
            $this->authorize('delete', $plan);
            $this->treatmentPlanService->delete($id);

            return response()->json(['message' => 'Plano de tratamento removido com sucesso.']);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
        }
    }

    public function duplicate(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        try {
            $plan = $this->treatmentPlanService->find($id);
            if ($plan->clinic_id !== (int) $clinicId) {
                return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
            }
            $newPlan = $this->treatmentPlanService->duplicate($id);

            return response()->json(['data' => $newPlan], 201);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
        }
    }

    public function toModel(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        try {
            $plan = $this->treatmentPlanService->find($id);
            if ($plan->clinic_id !== (int) $clinicId) {
                return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
            }
            $newPlan = $this->treatmentPlanService->toModel($id);

            return response()->json(['data' => $newPlan], 201);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
        }
    }

    public function downloadPdf(int $id)
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $plan     = $this->treatmentPlanService->find($id);
        if ($plan->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Plano de tratamento não encontrado.'], 404);
        }

        $plan->load([
            'groups.exercises.exercise.videos',
            'exercises.exercise.videos',
            'patient',
            'clinic',
            'physioArea',
            'physioSubarea',
        ]);

        $filename = ValidationHelper::generateSlug($plan->title) . '.pdf';

        return $this->pdfService->download('pdf.clinic.treatment.treatment-plan', compact('plan'), $filename);
    }
}
