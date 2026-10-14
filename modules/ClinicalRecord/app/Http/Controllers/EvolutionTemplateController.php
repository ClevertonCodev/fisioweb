<?php

namespace Modules\ClinicalRecord\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Modules\ClinicalRecord\Contracts\EvolutionTemplateServiceInterface;
use Modules\ClinicalRecord\Http\Requests\StoreEvolutionTemplateRequest;
use Modules\ClinicalRecord\Http\Requests\UpdateEvolutionTemplateRequest;

class EvolutionTemplateController extends ClinicAuthenticatedController
{
    public function __construct(
        protected EvolutionTemplateServiceInterface $templateService,
    ) {}

    public function index(): JsonResponse
    {
        $clinicId = $this->clinicId();
        $data     = $this->templateService->listForClinic($clinicId);

        return response()->json(['data' => $data]);
    }

    public function store(StoreEvolutionTemplateRequest $request): JsonResponse
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

        if (!$template->is_system && (int) $template->clinic_id !== $clinicId) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        return response()->json(['data' => $template]);
    }

    public function update(UpdateEvolutionTemplateRequest $request, int $id): JsonResponse
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
