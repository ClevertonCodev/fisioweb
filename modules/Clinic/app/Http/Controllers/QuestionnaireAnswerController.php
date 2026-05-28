<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Modules\Clinic\Http\Requests\AnswerPatientQuestionnaireRequest;
use Modules\Clinic\Models\PatientQuestionnaire;
use Modules\Clinic\Services\PatientQuestionnaireService;

class QuestionnaireAnswerController extends Controller
{
    public function __construct(
        protected PatientQuestionnaireService $questionnaireService,
    ) {}

    /**
     * Endpoint público (sem auth de clínica) para o paciente responder pelo link remoto.
     */
    public function store(AnswerPatientQuestionnaireRequest $request, int $id): JsonResponse
    {
        try {
            $questionnaire = PatientQuestionnaire::findOrFail($id);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Questionário não encontrado.'], 404);
        }

        if ($questionnaire->status !== PatientQuestionnaire::STATUS_PENDING) {
            return response()->json(['message' => 'Este questionário já foi respondido ou expirou.'], 422);
        }

        if ($questionnaire->expires_at && $questionnaire->expires_at->isPast()) {
            $questionnaire->update(['status' => PatientQuestionnaire::STATUS_EXPIRED]);

            return response()->json(['message' => 'Este questionário expirou.'], 422);
        }

        $result = $this->questionnaireService->answer($questionnaire, $request->validated()['answers']);

        return response()->json(['data' => $result]);
    }

    /**
     * Exibe o questionário com as perguntas para o paciente preencher (link remoto).
     */
    public function show(int $id): JsonResponse
    {
        try {
            $questionnaire = PatientQuestionnaire::query()
                ->with(['template.sections.questions'])
                ->findOrFail($id);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Questionário não encontrado.'], 404);
        }

        if ($questionnaire->status !== PatientQuestionnaire::STATUS_PENDING) {
            return response()->json(['message' => 'Este questionário já foi respondido ou expirou.'], 422);
        }

        if ($questionnaire->expires_at && $questionnaire->expires_at->isPast()) {
            $questionnaire->update(['status' => PatientQuestionnaire::STATUS_EXPIRED]);

            return response()->json(['message' => 'Este questionário expirou.'], 422);
        }

        return response()->json(['data' => $questionnaire]);
    }
}
