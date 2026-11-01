<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Modules\ClinicFinance\Contracts\FinanceSummaryServiceInterface;
use Modules\ClinicFinance\Http\Requests\ClearPeriodOpeningBalanceRequest;
use Modules\ClinicFinance\Http\Requests\UpdatePeriodOpeningBalanceRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicFinance\Models\PeriodOpeningBalance;

class FinancialSummaryController extends ClinicAuthenticatedController
{
    public function __construct(
        protected FinanceSummaryServiceInterface $summaryService,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $clinicId = $this->clinicId();
        $data     = $this->summaryService->summary($clinicId, $request->all());

        return response()->json(['data' => $data]);
    }

    public function updateOpeningBalance(UpdatePeriodOpeningBalanceRequest $request): JsonResponse
    {
        $this->authorize('update', PeriodOpeningBalance::class);

        $validated = $request->validated();

        $balance = $this->summaryService->updateOpeningBalance(
            $this->clinicId(),
            (int) $validated['year'],
            (int) $validated['month'],
            number_format((float) $validated['amount'], 2, '.', ''),
            $this->clinicUserId(),
        );

        return response()->json(['data' => $balance]);
    }

    public function clearOpeningBalance(ClearPeriodOpeningBalanceRequest $request): Response
    {
        $this->authorize('delete', PeriodOpeningBalance::class);

        [$year, $month] = $request->yearAndMonth();
        $this->summaryService->clearOpeningBalance($this->clinicId(), $year, $month);

        return response()->noContent();
    }
}
