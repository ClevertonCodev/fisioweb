<?php

namespace Modules\ClinicQuestionnaire\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Modules\ClinicQuestionnaire\Contracts\QuestionnaireTemplateServiceInterface;
use Modules\ClinicQuestionnaire\Http\Requests\StoreQuestionnaireTemplateRequest;
use Modules\ClinicQuestionnaire\Http\Requests\UpdateQuestionnaireTemplateRequest;

class QuestionnaireTemplateController extends ClinicAuthenticatedController
{
    public function __construct(
        protected QuestionnaireTemplateServiceInterface $templateService,
    ) {}

    public function index(): JsonResponse
    {
        $clinicId  = $this->clinicId();
        $templates = $this->templateService->listForClinic($clinicId);

        return response()->json(['data' => $templates]);
    }

    public function store(StoreQuestionnaireTemplateRequest $request): JsonResponse
    {
        $clinicId = $this->clinicId();
        $template = $this->templateService->create($request->validated(), $clinicId);

        return response()->json(['data' => $template], 201);
    }

    public function show(int $id): JsonResponse
    {
        $clinicId = $this->clinicId();

        try {
            $template = $this->templateService->find($id);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        if ((int) $template->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        return response()->json(['data' => $template]);
    }

    public function update(UpdateQuestionnaireTemplateRequest $request, int $id): JsonResponse
    {
        $clinicId = $this->clinicId();

        try {
            $template = $this->templateService->find($id);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        if ((int) $template->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        $template = $this->templateService->update($template, $request->validated());

        return response()->json(['data' => $template]);
    }

    public function destroy(int $id): JsonResponse
    {
        $clinicId = $this->clinicId();

        try {
            $template = $this->templateService->find($id);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        if ((int) $template->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        $this->authorize('delete', $template);

        $this->templateService->destroy($template);

        return response()->json(['message' => 'Template removido com sucesso.']);
    }
}
