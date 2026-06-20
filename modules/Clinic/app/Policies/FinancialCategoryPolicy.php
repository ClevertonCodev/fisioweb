<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\FinancialCategory;

class FinancialCategoryPolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return $user->isAdmin();
    }

    public function create(ClinicUser $user): bool
    {
        return $user->isAdmin();
    }

    public function update(ClinicUser $user, FinancialCategory $category): bool
    {
        return $user->isAdmin();
    }

    public function delete(ClinicUser $user, FinancialCategory $category): bool
    {
        return $user->isAdmin()
            && $category->origin->value === 'custom'
            && (int) $category->clinic_id === (int) $user->clinic_id;
    }
}
