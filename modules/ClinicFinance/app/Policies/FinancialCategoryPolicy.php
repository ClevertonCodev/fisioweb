<?php

namespace Modules\ClinicFinance\Policies;

use Modules\ClinicFinance\Models\FinancialCategory;

/** Ler a lista: administrador e secretária. Criar, ligar/desligar e excluir: só o administrador. */
class FinancialCategoryPolicy
{
    public function viewAny($user): bool
    {
        return FinanceAccess::canUse($user);
    }

    public function create($user): bool
    {
        return FinanceAccess::canManageSettings($user);
    }

    public function update($user, FinancialCategory $category): bool
    {
        return FinanceAccess::canManageSettings($user);
    }

    public function delete($user, FinancialCategory $category): bool
    {
        return FinanceAccess::canManageSettings($user)
            && $category->origin->value === 'custom'
            && (int) $category->clinic_id === (int) $user->clinic_id;
    }
}
