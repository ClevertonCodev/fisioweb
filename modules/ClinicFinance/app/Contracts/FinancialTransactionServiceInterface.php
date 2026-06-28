<?php

namespace Modules\ClinicFinance\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\ClinicFinance\Models\FinancialTransaction;

interface FinancialTransactionServiceInterface
{
    public function list(int $clinicId, array $filters = []): LengthAwarePaginator;

    public function listTrash(int $clinicId, array $filters = []): LengthAwarePaginator;

    public function create(int $clinicId, array $data): FinancialTransaction;

    public function update(int $clinicId, int $id, array $data): FinancialTransaction;

    public function softDelete(int $clinicId, int $id): void;

    public function restore(int $clinicId, int $id): FinancialTransaction;
}
