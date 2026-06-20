<?php

namespace Modules\Clinic\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Modules\Clinic\Contracts\FinancialCategoryRepositoryInterface;
use Modules\Clinic\Contracts\FinancialTransactionRepositoryInterface;
use Modules\Clinic\Models\FinancialTransaction;

class FinancialTransactionService
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

        return $transaction->load(['category', 'createdBy']);
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

        $updated = $this->repository->update($id, $data);

        return $updated;
    }

    public function softDelete(int $clinicId, int $id): void
    {
        $transaction = $this->repository->findOrFail($id);
        abort_if((int) $transaction->clinic_id !== $clinicId, 404);

        $this->repository->softDelete($transaction, (int) Auth::guard('clinic')->id());
    }

    public function restore(int $clinicId, int $id): FinancialTransaction
    {
        $transaction = $this->repository->findTrashed($id);
        abort_if($transaction === null || (int) $transaction->clinic_id !== $clinicId, 404);

        return $this->repository->restore($transaction);
    }
}
