<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Clinic\Models\FinancialTransaction;

interface FinancialTransactionRepositoryInterface
{
    public function find(int $id): ?FinancialTransaction;

    public function findOrFail(int $id): FinancialTransaction;

    public function findTrashed(int $id): ?FinancialTransaction;

    public function create(array $data): FinancialTransaction;

    public function update(int $id, array $data): FinancialTransaction;

    public function softDelete(FinancialTransaction $transaction, int $deletedByUserId): void;

    public function restore(FinancialTransaction $transaction): FinancialTransaction;

    public function paginateForClinic(int $clinicId, array $filters = []): LengthAwarePaginator;

    public function paginateTrashedForClinic(int $clinicId, array $filters = []): LengthAwarePaginator;

    /**
     * @return array{received: float, pending_income: float, paid: float, pending_expense: float}
     */
    public function aggregateSummary(int $clinicId, array $filters = []): array;
}
