<?php

namespace Modules\Clinic\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\PeriodOpeningBalanceRepositoryInterface;
use Modules\Clinic\Http\Requests\UpdatePeriodOpeningBalanceRequest;
use Modules\Clinic\Models\FinancialTransaction;
use Modules\Clinic\Services\FinanceSummaryService;

class FinancialSummaryController extends Controller
{
    public function __construct(
        protected FinanceSummaryService $summaryService,
        protected PeriodOpeningBalanceRepositoryInterface $openingBalanceRepository,
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

        $balance = $this->openingBalanceRepository->upsert(
            $clinicId,
            (int) $validated['year'],
            (int) $validated['month'],
            number_format((float) $validated['amount'], 2, '.', ''),
            (int) $user->id,
        );

        return response()->json(['data' => $balance]);
    }
}
