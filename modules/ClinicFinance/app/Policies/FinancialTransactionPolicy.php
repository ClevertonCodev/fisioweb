<?php

namespace Modules\ClinicFinance\Policies;

use Modules\ClinicFinance\Models\FinancialTransaction;

class FinancialTransactionPolicy
{
    public function viewAny($user): bool
    {
        return $user->isAdmin();
    }

    public function view($user, FinancialTransaction $transaction): bool
    {
        return $user->isAdmin()
            && (int) $user->clinic_id === (int) $transaction->clinic_id;
    }

    public function create($user): bool
    {
        return $user->isAdmin();
    }

    public function update($user, FinancialTransaction $transaction): bool
    {
        return $this->view($user, $transaction);
    }

    public function delete($user, FinancialTransaction $transaction): bool
    {
        return $this->view($user, $transaction);
    }

    public function restore($user, FinancialTransaction $transaction): bool
    {
        return $this->view($user, $transaction);
    }
}
