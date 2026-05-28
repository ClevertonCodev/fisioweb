<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Http\Requests\SendPatientQuestionnaireRequest;
use Modules\Clinic\Models\PatientQuestionnaire;
use Modules\Clinic\Services\PatientQuestionnaireService;
use Modules\Patient\Models\Patient;

class PatientQuestionnaireController extends Controller
{
    public function __construct(
        protected PatientQuestionnaireService $questionnaireService,
    ) {}

    public function indexByPatient(Patient $patient): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        if ((int) $patient->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $questionnaires = $this->questionnaireService->listByPatient((int) $clinicId, $patient->id);

        return response()->json(['data' => $questionnaires]);
    }

    public function storeForPatient(SendPatientQuestionnaireRequest $request, Patient $patient): JsonResponse
    {
        $clinicUser = Auth::guard('clinic')->user();

        if ((int) $patient->clinic_id !== (int) $clinicUser->clinic_id) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $questionnaire = $this->questionnaireService->send(
            (int) $clinicUser->clinic_id,
            $patient->id,
            $clinicUser->id,
            $request->validated(),
        );

        return response()->json(['data' => $questionnaire], 201);
    }

    public function show(Patient $patient, PatientQuestionnaire $questionnaire): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        if (
            (int) $patient->clinic_id !== (int) $clinicId
            || (int) $questionnaire->clinic_id !== (int) $clinicId
            || $questionnaire->patient_id !== $patient->id
        ) {
            return response()->json(['message' => 'Questionário não encontrado.'], 404);
        }

        return response()->json(['data' => $this->questionnaireService->find($questionnaire->id)]);
    }

    public function destroy(Patient $patient, PatientQuestionnaire $questionnaire): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        if (
            (int) $patient->clinic_id !== (int) $clinicId
            || (int) $questionnaire->clinic_id !== (int) $clinicId
            || $questionnaire->patient_id !== $patient->id
        ) {
            return response()->json(['message' => 'Questionário não encontrado.'], 404);
        }

        $this->authorize('delete', $questionnaire);

        $this->questionnaireService->destroy($questionnaire);

        return response()->json(['message' => 'Questionário removido com sucesso.']);
    }
}
