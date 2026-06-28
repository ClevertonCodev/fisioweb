<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Modules\ClinicFinance\Contracts\FinanceExportServiceInterface;
use Modules\ClinicFinance\Http\Requests\ExportFinancialTransactionsRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialExportController extends Controller
{
    public function __construct(
        protected FinanceExportServiceInterface $exportService,
    ) {}

    public function export(ExportFinancialTransactionsRequest $request)
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;

        return $this->exportService->export($clinicId, $request->validated());
    }
}
