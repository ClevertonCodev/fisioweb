<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\ClinicFinance\Contracts\FinanceReportServiceInterface;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialReportController extends ClinicAuthenticatedController
{
    public function __construct(
        protected FinanceReportServiceInterface $reportService,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = $this->clinicId();

        return response()->json(['data' => $this->reportService->reportSummary($clinicId, $request->all())]);
    }

    public function incomeVsExpense(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = $this->clinicId();

        return response()->json(['data' => $this->reportService->incomeVsExpense($clinicId, $request->all())]);
    }

    public function categoryDistribution(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = $this->clinicId();
        $limit    = (int) $request->query('limit', 5);

        return response()->json(['data' => $this->reportService->categoryDistribution($clinicId, $request->all(), $limit)]);
    }

    public function monthlyComparison(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = $this->clinicId();
        $months   = (int) $request->query('months', 12);

        return response()->json(['data' => $this->reportService->monthlyComparison($clinicId, $months)]);
    }

    public function categoryBreakdown(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);
        $clinicId = $this->clinicId();

        return response()->json(['data' => $this->reportService->categoryBreakdown($clinicId, $request->all())]);
    }
}
