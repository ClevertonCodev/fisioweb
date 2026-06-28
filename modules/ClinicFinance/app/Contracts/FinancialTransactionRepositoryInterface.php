<?php

namespace Modules\ClinicFinance\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Modules\ClinicFinance\Models\FinancialTransaction;

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
     * @param  array{from: string, to: string}  $range
     * @return Collection<int, FinancialTransaction>
     */
    public function listForExport(int $clinicId, array $range): Collection;

    /**
     * @return array{received: float, pending_income: float, paid: float, pending_expense: float}
     */
    public function aggregateSummary(int $clinicId, array $filters = []): array;

    /**
     * @return Collection<int, object>
     */
    public function incomeVsExpenseRows(int $clinicId, array $filters = []): Collection;

    /**
     * @return Collection<int, object>
     */
    public function categoryDistributionRows(int $clinicId, array $filters = [], int $limit = 5): Collection;

    /**
     * @return array{start: \Carbon\Carbon, end: \Carbon\Carbon, rows: Collection<int, object>}
     */
    public function monthlyComparisonRows(int $clinicId, int $months = 12): array;

    /**
     * @return Collection<int, object>
     */
    public function categoryBreakdownRows(int $clinicId, array $filters = []): Collection;
}
