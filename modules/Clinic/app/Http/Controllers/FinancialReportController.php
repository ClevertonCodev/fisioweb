<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Models\FinancialTransaction;
use Modules\Clinic\Services\FinanceReportService;

class FinancialReportController extends Controller
{
    public function __construct(
        protected FinanceReportService $reportService,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;

        return response()->json(['data' => $this->reportService->reportSummary($clinicId, $request->all())]);
    }

    public function incomeVsExpense(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;

        return response()->json(['data' => $this->reportService->incomeVsExpense($clinicId, $request->all())]);
    }

    public function categoryDistribution(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $limit    = (int) $request->query('limit', 5);

        return response()->json(['data' => $this->reportService->categoryDistribution($clinicId, $request->all(), $limit)]);
    }

    public function monthlyComparison(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $months   = (int) $request->query('months', 12);

        return response()->json(['data' => $this->reportService->monthlyComparison($clinicId, $months)]);
    }

    public function categoryBreakdown(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;

        return response()->json(['data' => $this->reportService->categoryBreakdown($clinicId, $request->all())]);
    }
}
