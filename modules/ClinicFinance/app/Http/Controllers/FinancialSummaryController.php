<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\ClinicFinance\Contracts\FinanceSummaryServiceInterface;
use Modules\ClinicFinance\Http\Requests\UpdatePeriodOpeningBalanceRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;

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
        $this->authorize('viewAny', FinancialTransaction::class);

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
}
