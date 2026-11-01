<?php

namespace Modules\ClinicFinance\Policies;

use Modules\ClinicFinance\Models\FinancialTransaction;

/** Administrador (também pelo Gate::before) e secretária, sempre da clínica do lançamento. */
class FinancialTransactionPolicy
{
    public function viewAny($user): bool
    {
        return FinanceAccess::canUse($user);
    }

    public function view($user, FinancialTransaction $transaction): bool
    {
        return FinanceAccess::canUse($user)
            && (int) $user->clinic_id === (int) $transaction->clinic_id;
    }

    public function create($user): bool
    {
        return FinanceAccess::canUse($user);
    }

    public function update($user, FinancialTransaction $transaction): bool
    {
        return $this->view($user, $transaction);
    }

    public function delete($user, FinancialTransaction $transaction): bool
    {
        return $this->view($user, $transaction);
    }

    /** Sem o lançamento, confere só o papel; a posse fica no Service (404 se for de outra clínica). */
    public function restore($user, ?FinancialTransaction $transaction = null): bool
    {
        return is_null($transaction)
            ? FinanceAccess::canUse($user)
            : $this->view($user, $transaction);
    }
}
