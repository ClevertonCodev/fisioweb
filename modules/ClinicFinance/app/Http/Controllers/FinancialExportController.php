<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Modules\ClinicFinance\Contracts\FinanceExportServiceInterface;
use Modules\ClinicFinance\Http\Requests\ExportFinancialTransactionsRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialExportController extends ClinicAuthenticatedController
{
    public function __construct(
        protected FinanceExportServiceInterface $exportService,
    ) {}

    public function export(ExportFinancialTransactionsRequest $request)
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $clinicId = $this->clinicId();

        return $this->exportService->export($clinicId, $request->validated());
    }
}
