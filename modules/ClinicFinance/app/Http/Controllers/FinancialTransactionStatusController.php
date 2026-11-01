<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Modules\ClinicFinance\Contracts\FinancialTransactionServiceInterface;
use Modules\ClinicFinance\Http\Requests\UpdateFinancialTransactionStatusRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;

/** PATCH /clinic/finances/transactions/{transaction}/status: a baixa em um clique e o "Desfazer". */
class FinancialTransactionStatusController extends ClinicAuthenticatedController
{
    public function __construct(
        protected FinancialTransactionServiceInterface $transactionService,
    ) {}

    public function __invoke(UpdateFinancialTransactionStatusRequest $request, FinancialTransaction $transaction): JsonResponse
    {
        abort_if((int) $transaction->clinic_id !== $this->clinicId(), 404);
        $this->authorize('update', $transaction);

        $updated = $this->transactionService->changeStatus($this->clinicId(), $transaction->id, $request->status());

        return response()->json(['data' => $updated]);
    }
}
