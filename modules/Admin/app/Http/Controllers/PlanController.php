<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Admin\Http\Requests\StorePlanRequest;
use Modules\Admin\Http\Requests\UpdatePlanRequest;
use Modules\Admin\Models\Plan;

class PlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Plan::query();

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search);
                } else {
                    $q->orWhere('name', 'like', "%{$search}%");
                }
            });
        }

        $perPage = $request->integer('per_page', 10);
        $plans   = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return response()->json(['data' => $plans]);
    }

    public function show(int $id): JsonResponse
    {
        try {
            $plan = Plan::findOrFail($id);

            return response()->json(['data' => $plan]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Plano não encontrado.'], 404);
        }
    }

    public function store(StorePlanRequest $request): JsonResponse
    {
        $plan = Plan::create($request->validated());

        return response()->json(['data' => $plan], 201);
    }

    public function update(UpdatePlanRequest $request, int $id): JsonResponse
    {
        try {
            $plan = Plan::findOrFail($id);
            $plan->update($request->validated());

            return response()->json(['data' => $plan->fresh()]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Plano não encontrado.'], 404);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $plan = Plan::findOrFail($id);
            $plan->delete();

            return response()->json(['message' => 'Plano removido com sucesso.']);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Plano não encontrado.'], 404);
        }
    }
}
