<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Modules\ClinicFinance\Contracts\FinanceCalendarServiceInterface;
use Modules\ClinicFinance\Http\Requests\FinanceCalendarRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialCalendarController extends ClinicAuthenticatedController
{
    public function __construct(
        protected FinanceCalendarServiceInterface $calendarService,
    ) {}

    public function month(FinanceCalendarRequest $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        return response()->json([
            'data' => $this->calendarService->month($this->clinicId(), $request->validated('period')),
        ]);
    }
}
