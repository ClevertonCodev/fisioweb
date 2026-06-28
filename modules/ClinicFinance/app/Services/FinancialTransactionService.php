<?php

namespace Modules\ClinicFinance\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\ClinicFinance\Contracts\FinancialCategoryRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionServiceInterface;
use Modules\ClinicFinance\Events\FinancialTransactionDeleted;
use Modules\ClinicFinance\Events\FinancialTransactionRecorded;
use Modules\ClinicFinance\Events\FinancialTransactionUpdated;
use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialTransactionService implements FinancialTransactionServiceInterface
{
    public function __construct(
        protected FinancialTransactionRepositoryInterface $repository,
        protected FinancialCategoryRepositoryInterface $categoryRepository,
    ) {}

    public function list(int $clinicId, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginateForClinic($clinicId, $filters);
    }

    public function listTrash(int $clinicId, array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginateTrashedForClinic($clinicId, $filters);
    }

    public function create(int $clinicId, array $data): FinancialTransaction
    {
        $category = $this->categoryRepository->findAvailableForClinic($clinicId, (int) $data['financial_category_id']);
        abort_if($category === null, 422, 'Categoria inválida para esta clínica.');

        $gross = (float) $data['gross_amount'];
        $fee   = (float) ($data['fee_amount'] ?? 0);

        $transaction = $this->repository->create([
            ...$data,
            'clinic_id'          => $clinicId,
            'net_amount'         => FinancialTransaction::computeNetAmount($gross, $fee),
            'created_by_user_id' => Auth::guard('clinic')->id(),
        ]);

        $transaction = $transaction->load(['category', 'createdBy']);

        $event = new FinancialTransactionRecorded(
            version: 1,
            transactionId: (int) $transaction->id,
            clinicId: (int) $transaction->clinic_id,
            actorId: Auth::guard('clinic')->id(),
            type: $transaction->type->value,
            status: $transaction->status->value,
            amount: (string) $transaction->gross_amount,
            date: $transaction->date->toDateString(),
            categoryId: $transaction->financial_category_id ? (int) $transaction->financial_category_id : null,
            occurredAt: now()->toImmutable(),
        );

        DB::afterCommit(fn () => Event::dispatch($event));

        return $transaction;
    }

    public function update(int $clinicId, int $id, array $data): FinancialTransaction
    {
        $transaction = $this->repository->findOrFail($id);
        abort_if((int) $transaction->clinic_id !== $clinicId, 404);

        if (isset($data['financial_category_id'])) {
            $category = $this->categoryRepository->findAvailableForClinic($clinicId, (int) $data['financial_category_id']);
            abort_if($category === null, 422, 'Categoria inválida para esta clínica.');
        }

        $gross              = (float) ($data['gross_amount'] ?? $transaction->gross_amount);
        $fee                = (float) ($data['fee_amount'] ?? $transaction->fee_amount);
        $data['net_amount'] = FinancialTransaction::computeNetAmount($gross, $fee);

        $changedFields = array_keys($data);
        $updated       = $this->repository->update($id, $data);

        $event = new FinancialTransactionUpdated(
            version: 1,
            transactionId: (int) $updated->id,
            clinicId: (int) $updated->clinic_id,
            actorId: Auth::guard('clinic')->id(),
            changedFields: $changedFields,
            status: $updated->status->value,
            amount: (string) $updated->gross_amount,
            date: $updated->date->toDateString(),
            occurredAt: now()->toImmutable(),
        );

        DB::afterCommit(fn () => Event::dispatch($event));

        return $updated;
    }

    public function softDelete(int $clinicId, int $id): void
    {
        $transaction = $this->repository->findOrFail($id);
        abort_if((int) $transaction->clinic_id !== $clinicId, 404);

        $actorId = Auth::guard('clinic')->id();
        $this->repository->softDelete($transaction, (int) $actorId);

        $event = new FinancialTransactionDeleted(
            version: 1,
            transactionId: (int) $transaction->id,
            clinicId: (int) $transaction->clinic_id,
            actorId: $actorId,
            occurredAt: now()->toImmutable(),
        );

        DB::afterCommit(fn () => Event::dispatch($event));
    }

    public function restore(int $clinicId, int $id): FinancialTransaction
    {
        $transaction = $this->repository->findTrashed($id);
        abort_if(is_null($transaction) || (int) $transaction->clinic_id !== $clinicId, 404);

        return $this->repository->restore($transaction);
    }
}
