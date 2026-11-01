<?php

namespace Modules\ClinicFinance\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\ClinicFinance\Contracts\FinancialSeriesServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionServiceInterface;
use Modules\ClinicFinance\Http\Requests\DestroyFinancialTransactionRequest;
use Modules\ClinicFinance\Http\Requests\ListFinancialTransactionsRequest;
use Modules\ClinicFinance\Http\Requests\StoreFinancialTransactionRequest;
use Modules\ClinicFinance\Http\Requests\UpdateFinancialTransactionRequest;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialTransactionController extends ClinicAuthenticatedController
{
    public function __construct(
        protected FinancialTransactionServiceInterface $transactionService,
    ) {}

    public function index(ListFinancialTransactionsRequest $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $clinicId  = $this->clinicId();
        $filters   = $request->all();
        $paginator = $this->transactionService->list($clinicId, $filters);
        $netTotal  = $this->transactionService->pendingNetTotal($clinicId, $filters);

        return response()->json([
            'data' => $paginator->items(),
            'meta' => array_filter([
                'page'     => $paginator->currentPage(),
                'perPage'  => $paginator->perPage(),
                'total'    => $paginator->total(),
                'netTotal' => $netTotal,
            ], fn ($value) => !is_null($value)),
        ]);
    }

    public function store(StoreFinancialTransactionRequest $request, FinancialSeriesServiceInterface $seriesService): JsonResponse
    {
        $this->authorize('create', FinancialTransaction::class);

        $recorded = $seriesService->record($this->clinicId(), $request->transactionData(), $request->repeat());

        return response()->json([
            'data' => $recorded->first,
            'meta' => ['createdCount' => $recorded->count],
        ], 201);
    }

    public function show(FinancialTransaction $transaction): JsonResponse
    {
        $this->authorizeClinic($transaction);
        $this->authorize('view', $transaction);

        return response()->json(['data' => $this->transactionService->show($this->clinicId(), $transaction->id)]);
    }

    public function update(UpdateFinancialTransactionRequest $request, FinancialTransaction $transaction, FinancialSeriesServiceInterface $seriesService): JsonResponse
    {
        $this->authorizeClinic($transaction);
        $this->authorize('update', $transaction);

        $updated = $seriesService->update($this->clinicId(), $transaction->id, $request->transactionData(), $request->scope());

        return response()->json(['data' => $updated]);
    }

    public function destroy(DestroyFinancialTransactionRequest $request, FinancialTransaction $transaction, FinancialSeriesServiceInterface $seriesService): JsonResponse
    {
        $this->authorizeClinic($transaction);
        $this->authorize('delete', $transaction);

        $seriesService->delete($this->clinicId(), $transaction->id, $request->scope());

        return response()->json(null, 204);
    }

    public function trash(Request $request): JsonResponse
    {
        $this->authorize('viewAny', FinancialTransaction::class);

        $clinicId  = $this->clinicId();
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
        // Antes de restaurar: depois seria tarde. A posse (404) fica no Service.
        $this->authorize('restore', FinancialTransaction::class);

        $transaction = $this->transactionService->restore($this->clinicId(), $id);

        return response()->json(['data' => $transaction]);
    }

    private function authorizeClinic(FinancialTransaction $transaction): void
    {
        abort_if((int) $transaction->clinic_id !== $this->clinicId(), 404);
    }
}
