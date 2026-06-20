<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\Clinic\Models\FinancialCategory;

interface FinancialCategoryRepositoryInterface
{
    public function listAvailableForClinic(int $clinicId, ?string $type = null): Collection;

    public function find(int $id): ?FinancialCategory;

    public function findAvailableForClinic(int $clinicId, int $categoryId): ?FinancialCategory;

    public function createCustom(int $clinicId, string $name, string $type): FinancialCategory;

    public function toggleActive(int $clinicId, FinancialCategory $category): FinancialCategory;

    public function deleteCustom(FinancialCategory $category): bool;

    public function hasTransactions(FinancialCategory $category): bool;
}
