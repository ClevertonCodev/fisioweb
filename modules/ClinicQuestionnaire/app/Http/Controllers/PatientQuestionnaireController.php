<?php

namespace Modules\ClinicQuestionnaire\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireServiceInterface;
use Modules\ClinicQuestionnaire\Http\Requests\AnswerPatientQuestionnaireRequest;
use Modules\ClinicQuestionnaire\Http\Requests\SendPatientQuestionnaireRequest;
use Modules\Patient\Contracts\PatientServiceInterface;

class PatientQuestionnaireController extends ClinicAuthenticatedController
{
    public function __construct(
        protected PatientQuestionnaireServiceInterface $questionnaireService,
        protected PatientServiceInterface $patientService,
    ) {}

    public function indexByPatient(int $patient): JsonResponse
    {
        $clinicId = $this->clinicId();
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $questionnaires = $this->questionnaireService->listByPatient($clinicId, $patient);

        return response()->json(['data' => $questionnaires]);
    }

    public function storeForPatient(SendPatientQuestionnaireRequest $request, int $patient): JsonResponse
    {
        $clinicId = $this->clinicId();
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $questionnaire = $this->questionnaireService->send(
            $clinicId,
            $patient,
            $this->clinicUserId(),
            $request->validated(),
        );

        return response()->json(['data' => $questionnaire], 201);
    }

    public function show(int $patient, int $questionnaire): JsonResponse
    {
        $clinicId = $this->clinicId();
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $record = $this->questionnaireService->findForPatient($clinicId, $patient, $questionnaire);

        if (is_null($record)) {
            return response()->json(['message' => 'Questionário não encontrado.'], 404);
        }

        return response()->json(['data' => $record]);
    }

    public function answer(AnswerPatientQuestionnaireRequest $request, int $patient, int $questionnaire): JsonResponse
    {
        $clinicId = $this->clinicId();
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        try {
            $record = $this->questionnaireService->answerForClinicPatient(
                $clinicId,
                $patient,
                $questionnaire,
                $request->validated()['answers'],
            );
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Questionário não encontrado.'], 404);
        } catch (ValidationException $exception) {
            $message = collect($exception->errors())->flatten()->first() ?? $exception->getMessage();

            return response()->json(['message' => $message], 422);
        }

        return response()->json(['data' => $record]);
    }

    public function destroy(int $patient, int $questionnaire): JsonResponse
    {
        $clinicId = $this->clinicId();
        $found    = $this->patientService->find($patient);

        if (!$found || (int) $found->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Paciente não encontrado.'], 404);
        }

        $record = $this->questionnaireService->findForPatient($clinicId, $patient, $questionnaire);

        if (is_null($record)) {
            return response()->json(['message' => 'Questionário não encontrado.'], 404);
        }

        $this->authorize('delete', $record);

        $this->questionnaireService->destroy($record);

        return response()->json(['message' => 'Questionário removido com sucesso.']);
    }
}
