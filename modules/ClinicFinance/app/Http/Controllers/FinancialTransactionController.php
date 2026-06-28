<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Modules\ClinicFinance\Contracts\FinancialTransactionServiceInterface;
use Modules\ClinicFinance\Http\Requests\StoreFinancialTransactionRequest;
use Modules\ClinicFinance\Http\Requests\UpdateFinancialTransactionRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialTransactionController extends Controller
{
    public function __construct(
        protected FinancialTransactionServiceInterface $transactionService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $clinicId  = (int) Auth::guard('clinic')->user()->clinic_id;
        $paginator = $this->transactionService->list($clinicId, $request->all());

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'page'    => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total'   => $paginator->total(),
            ],
        ]);
    }

    public function store(StoreFinancialTransactionRequest $request): JsonResponse
    {
        $this->authorize('create', FinancialTransaction::class);

        $clinicId    = (int) Auth::guard('clinic')->user()->clinic_id;
        $transaction = $this->transactionService->create($clinicId, $request->validated());

        return response()->json(['data' => $transaction], 201);
    }

    public function show(FinancialTransaction $transaction): JsonResponse
    {
        $this->authorizeClinic($transaction);
        $this->authorize('view', $transaction);

        return response()->json(['data' => $transaction->load(['category', 'createdBy'])]);
    }

    public function update(UpdateFinancialTransactionRequest $request, FinancialTransaction $transaction): JsonResponse
    {
        $this->authorizeClinic($transaction);
        $this->authorize('update', $transaction);

        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $updated  = $this->transactionService->update($clinicId, $transaction->id, $request->validated());

        return response()->json(['data' => $updated]);
    }

    public function destroy(FinancialTransaction $transaction): JsonResponse
    {
        $this->authorizeClinic($transaction);
        $this->authorize('delete', $transaction);

        $clinicId = (int) Auth::guard('clinic')->user()->clinic_id;
        $this->transactionService->softDelete($clinicId, $transaction->id);

        return response()->json(null, 204);
    }

    public function trash(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $clinicId  = (int) Auth::guard('clinic')->user()->clinic_id;
        $paginator = $this->transactionService->listTrash($clinicId, $request->all());

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'page'    => $paginator->currentPage(),
                'perPage' => $paginator->perPage(),
                'total'   => $paginator->total(),
            ],
        ]);
    }

    public function restore(int $id): JsonResponse
    {
        $clinicId    = (int) Auth::guard('clinic')->user()->clinic_id;
        $transaction = $this->transactionService->restore($clinicId, $id);
        $this->authorize('restore', $transaction);

        return response()->json(['data' => $transaction]);
    }

    private function authorizeClinic(FinancialTransaction $transaction): void
    {
        abort_if((int) $transaction->clinic_id !== (int) Auth::guard('clinic')->user()->clinic_id, 404);
    }
}
