<?php

namespace Modules\ClinicalRecord\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Admin\Contracts\Public\AssessmentTemplateReadServiceInterface;

class SharedAssessmentTemplateController extends Controller
{
    public function __construct(
        protected AssessmentTemplateReadServiceInterface $assessmentTemplateReadService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $templates = $this->assessmentTemplateReadService->listActive(
            $request->get('search'),
            $request->integer('per_page', 15),
        );

        return response()->json($templates);
    }

    public function show(int $id): JsonResponse
    {
        $template = $this->assessmentTemplateReadService->findActiveForShow($id);

        if (is_null($template)) {
            return response()->json(['message' => 'Template não encontrado.'], 404);
        }

        return response()->json(['data' => $template]);
    }
}
