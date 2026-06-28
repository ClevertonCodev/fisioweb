<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\ClinicFinance\Contracts\FinancialCategoryServiceInterface;
use Modules\ClinicFinance\Http\Requests\StoreFinancialCategoryRequest;
use Modules\ClinicFinance\Models\FinancialCategory;

class FinancialCategoryController extends Controller
{
    public function __construct(
        protected FinancialCategoryServiceInterface $categoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialCategory::class);

        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $type     = $request->query('type');

        return response()->json([
            'data' => $this->categoryService->list($clinicId, $type),
        ]);
    }

    public function store(StoreFinancialCategoryRequest $request): JsonResponse
    {
        $this->authorize('create', FinancialCategory::class);

        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $category = $this->categoryService->create($clinicId, $request->validated());

        return response()->json(['data' => $category], 201);
    }

    public function toggleActive(FinancialCategory $category): JsonResponse
    {
        $this->authorize('update', $category);

        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $updated  = $this->categoryService->toggle($clinicId, $category);

        return response()->json(['data' => ['id' => $updated->id, 'active' => true]]);
    }

    public function destroy(FinancialCategory $category): JsonResponse
    {
        $this->authorize('delete', $category);

        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $this->categoryService->delete($clinicId, $category);

        return response()->json(null, 204);
    }
}
