<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Admin\Http\Requests\StoreFeatureRequest;
use Modules\Admin\Http\Requests\UpdateFeatureRequest;
use Modules\Admin\Models\Feature;

class FeatureController extends Controller
{
    public function createOptions(): JsonResponse
    {
        $allowedKeys    = Feature::allowedKeys();
        $registeredKeys = Feature::query()->pluck('key')->all();
        $availableKeys  = array_diff_key($allowedKeys, array_flip($registeredKeys));

        return response()->json([
            'data' => [
                'allowed_keys'   => $allowedKeys,
                'available_keys' => $availableKeys,
                'types'          => Feature::availableTypes(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = Feature::query();

        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                if (is_numeric($search)) {
                    $q->where('id', $search);
                } else {
                    $q->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('key', 'like', "%{$search}%");
                }
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->get('type'));
        }

        $perPage  = $request->integer('per_page', 10);
        $features = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        return response()->json(['data' => $features]);
    }

    public function show(int $id): JsonResponse
    {
        try {
            $feature = Feature::findOrFail($id);

            return response()->json(['data' => $feature]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Funcionalidade não encontrada.'], 404);
        }
    }

    public function store(StoreFeatureRequest $request): JsonResponse
    {
        $feature = Feature::create($request->validated());

        return response()->json(['data' => $feature], 201);
    }

    public function update(UpdateFeatureRequest $request, int $id): JsonResponse
    {
        try {
            $feature = Feature::findOrFail($id);
            $feature->update($request->validated());

            return response()->json(['data' => $feature->fresh()]);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Funcionalidade não encontrada.'], 404);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $feature = Feature::findOrFail($id);
            $feature->delete();

            return response()->json(['message' => 'Funcionalidade removida com sucesso.']);
        } catch (ModelNotFoundException) {
            return response()->json(['message' => 'Funcionalidade não encontrada.'], 404);
        }
    }
}
