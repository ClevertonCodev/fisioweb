<?php

namespace Modules\ClinicFinance\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicFinance\Models\FinancialCategory;

interface FinancialCategoryServiceInterface
{
    /**
     * @return Collection<int, FinancialCategory>
     */
    public function list(int $clinicId, ?string $type = null): Collection;

    public function create(int $clinicId, array $data): FinancialCategory;

    public function toggle(int $clinicId, FinancialCategory $category): FinancialCategory;

    public function delete(int $clinicId, FinancialCategory $category): void;
}
