<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Validation\Rule;
use Modules\Admin\Models\FeaturePlan;

class FeaturePlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FeaturePlan::query()->with(['plan:id,name', 'feature:id,name,key']);

        if ($request->filled('plan_id')) {
            $query->where('plan_id', $request->integer('plan_id'));
        }
        if ($request->filled('feature_id')) {
            $query->where('feature_id', $request->integer('feature_id'));
        }

        $perPage      = $request->integer('per_page', 15);
        $featurePlans = $query->orderBy('plan_id')->orderBy('feature_id')->paginate($perPage)->withQueryString();

        return response()->json(['data' => $featurePlans]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'plan_id'    => ['required', 'integer', 'exists:plans,id'],
            'feature_id' => ['required', 'integer', 'exists:features,id'],
            'value'      => ['required', Rule::in([true, false, 'true', 'false', 1, 0, '1', '0'])],
        ], [
            'plan_id.exists'    => 'O plano selecionado não existe.',
            'feature_id.exists' => 'A funcionalidade selecionada não existe.',
        ]);

        $exists = FeaturePlan::query()
            ->where('plan_id', $validated['plan_id'])
            ->where('feature_id', $validated['feature_id'])
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Esta funcionalidade já está configurada para este plano.'], 422);
        }

        $featurePlan = FeaturePlan::create([
            'plan_id'    => $validated['plan_id'],
            'feature_id' => $validated['feature_id'],
            'value'      => filter_var($validated['value'], FILTER_VALIDATE_BOOLEAN),
        ]);

        return response()->json(['data' => $featurePlan->load(['plan', 'feature'])], 201);
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $featurePlan = FeaturePlan::findOrFail($id);
            $featurePlan->delete();

            return response()->json(['message' => 'Configuração removida com sucesso.']);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Configuração não encontrada.'], 404);
        }
    }
}
