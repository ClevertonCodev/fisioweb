<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\ClinicFinance\Contracts\FinanceSummaryServiceInterface;
use Modules\ClinicFinance\Http\Requests\UpdatePeriodOpeningBalanceRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialSummaryController extends Controller
{
    public function __construct(
        protected FinanceSummaryServiceInterface $summaryService,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $data     = $this->summaryService->summary($clinicId, $request->all());

        return response()->json(['data' => $data]);
    }

    public function updateOpeningBalance(UpdatePeriodOpeningBalanceRequest $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $user      = Auth::guard('clinic')->user();
        $clinicId  = (int) $user->clinic_id;
        $validated = $request->validated();

        $balance = $this->summaryService->updateOpeningBalance(
            $clinicId,
            (int) $validated['year'],
            (int) $validated['month'],
            number_format((float) $validated['amount'], 2, '.', ''),
            (int) $user->id,
        );

        return response()->json(['data' => $balance]);
    }
}
