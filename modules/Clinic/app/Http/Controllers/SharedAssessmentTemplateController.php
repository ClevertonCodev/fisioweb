<?php

namespace Modules\Clinic\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Admin\Models\AdminAssessmentTemplate;

class SharedAssessmentTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AdminAssessmentTemplate::query()
            ->withCount('fields')
            ->where('is_active', true);

        if ($search = $request->get('search')) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        $templates = $query->orderBy('sort_order')->orderBy('name')->paginate($request->integer('per_page', 15));

        return response()->json($templates);
    }

    public function show(int $id): JsonResponse
    {
        $template = AdminAssessmentTemplate::query()
            ->with([
                'createdBy',
                'sections.fields.options',
            ])
            ->withCount('fields')
            ->where('is_active', true)
            ->findOrFail($id);

        return response()->json(['data' => $template]);
    }
}
