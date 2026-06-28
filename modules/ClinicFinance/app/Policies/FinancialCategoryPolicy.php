<?php

namespace Modules\ClinicFinance\Policies;

use Modules\ClinicFinance\Models\FinancialCategory;

class FinancialCategoryPolicy
{
    public function viewAny($user): bool
    {
        return $user->isAdmin();
    }

    public function create($user): bool
    {
        return $user->isAdmin();
    }

    public function update($user, FinancialCategory $category): bool
    {
        return $user->isAdmin();
    }

    public function delete($user, FinancialCategory $category): bool
    {
        return $user->isAdmin()
            && $category->origin->value === 'custom'
            && (int) $category->clinic_id === (int) $user->clinic_id;
    }
}
