<?php

namespace Modules\ClinicQuestionnaire\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireServiceInterface;
use Modules\ClinicQuestionnaire\Http\Requests\AnswerPatientQuestionnaireRequest;

class QuestionnaireAnswerController extends Controller
{
    public function __construct(
        protected PatientQuestionnaireServiceInterface $questionnaireService,
    ) {}

    public function store(AnswerPatientQuestionnaireRequest $request, string $token): JsonResponse
    {
        try {
            $result = $this->questionnaireService->submitPublicAnswer($token, $request->validated()['answers']);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Questionário não encontrado.'], 404);
        } catch (ValidationException $exception) {
            $message = collect($exception->errors())->flatten()->first() ?? $exception->getMessage();

            return response()->json(['message' => $message], 422);
        }

        return response()->json(['data' => $result]);
    }

    public function show(string $token): JsonResponse
    {
        try {
            $questionnaire = $this->questionnaireService->showForPublic($token);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Questionário não encontrado.'], 404);
        } catch (ValidationException $exception) {
            $message = collect($exception->errors())->flatten()->first() ?? $exception->getMessage();

            return response()->json(['message' => $message], 422);
        }

        return response()->json(['data' => $questionnaire]);
    }
}
