<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Http\Requests\StoreQuestionnaireTemplateRequest;
use Modules\Clinic\Http\Requests\UpdateQuestionnaireTemplateRequest;
use Modules\Clinic\Services\QuestionnaireTemplateService;

class QuestionnaireTemplateController extends Controller
{
    public function __construct(
        protected QuestionnaireTemplateService $templateService,
    ) {}

    public function index(): JsonResponse
    {
        $clinicId  = Auth::guard('clinic')->user()->clinic_id;
        $templates = $this->templateService->listForClinic((int) $clinicId);

        return response()->json(['data' => $templates]);
    }

    public function store(StoreQuestionnaireTemplateRequest $request): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;
        $template = $this->templateService->create($request->validated(), (int) $clinicId);

        return response()->json(['data' => $template], 201);
    }

    public function show(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $template = $this->templateService->find($id);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        if ((int) $template->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        return response()->json(['data' => $template]);
    }

    public function update(UpdateQuestionnaireTemplateRequest $request, int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $template = $this->templateService->find($id);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        if ((int) $template->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        $template = $this->templateService->update($template, $request->validated());

        return response()->json(['data' => $template]);
    }

    public function destroy(int $id): JsonResponse
    {
        $clinicId = Auth::guard('clinic')->user()->clinic_id;

        try {
            $template = $this->templateService->find($id);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        if ((int) $template->clinic_id !== (int) $clinicId) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        $this->authorize('delete', $template);

        $this->templateService->destroy($template);

        return response()->json(['message' => 'Template removido com sucesso.']);
    }
}
