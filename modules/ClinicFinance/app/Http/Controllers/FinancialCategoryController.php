<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\ClinicFinance\Contracts\FinancialCategoryServiceInterface;
use Modules\ClinicFinance\Http\Requests\StoreFinancialCategoryRequest;
use Modules\ClinicFinance\Models\FinancialCategory;

class FinancialCategoryController extends ClinicAuthenticatedController
{
    public function __construct(
        protected FinancialCategoryServiceInterface $categoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialCategory::class);

        $clinicId = $this->clinicId();
        $type     = $request->query('type');

        return response()->json([
            'data' => $this->categoryService->list($clinicId, $type),
        ]);
    }

    public function store(StoreFinancialCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', FinancialCategory::class);

        $clinicId = $this->clinicId();
        $category = $this->categoryService->create($clinicId, $request->validated());

        return response()->json(['data' => $category], 201);
    }

    public function toggleActive(FinancialCategory $category): JsonResponse
    {
        $this->authorize('update', $category);

        $clinicId = $this->clinicId();
        $updated  = $this->categoryService->toggle($clinicId, $category);

        return response()->json(['data' => ['id' => $updated->id, 'active' => true]]);
    }

    public function destroy(FinancialCategory $category): JsonResponse
    {
        $this->authorize('delete', $category);

        $clinicId = $this->clinicId();
        $this->categoryService->delete($clinicId, $category);

        return response()->json(null, 204);
    }
}
