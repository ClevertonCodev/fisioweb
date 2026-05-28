<?php

namespace Modules\Admin\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Modules\Admin\Contracts\AdminProgramServiceInterface;
use Modules\Admin\Http\Requests\StoreAdminProgramRequest;
use Modules\Admin\Http\Requests\UpdateAdminProgramRequest;

class AdminProgramController extends Controller
{
    public function __construct(private readonly AdminProgramServiceInterface $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'physio_area_id', 'is_active']);
        $perPage = (int) $request->get('per_page', 15);

        if (isset($filters['is_active'])) {
            $filters['is_active'] = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        $programs = $this->service->list($filters, $perPage);

        return response()->json($programs);
    }

    public function show(int $id): JsonResponse
    {
        try {
            $program = $this->service->find($id);

            return response()->json(['data' => $program]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Programa não encontrado.'], 404);
        }
    }

    public function detail(int $id): JsonResponse
    {
        try {
            $program = $this->service->findWithDetail($id);

            return response()->json(['data' => $program]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Programa não encontrado.'], 404);
        }
    }

    public function store(StoreAdminProgramRequest $request): JsonResponse
    {
        $program = $this->service->create($request->validated());

        return response()->json(['data' => $program], 201);
    }

    public function update(UpdateAdminProgramRequest $request, int $id): JsonResponse
    {
        try {
            $program = $this->service->update($id, $request->validated());

            return response()->json(['data' => $program]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Programa não encontrado.'], 404);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->service->delete($id);

            return response()->json(null, 204);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return response()->json(['message' => 'Programa não encontrado.'], 404);
        }
    }
}
