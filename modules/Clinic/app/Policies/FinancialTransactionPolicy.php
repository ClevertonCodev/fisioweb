<?php

namespace Modules\Clinic\Policies;

use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\FinancialTransaction;

class FinancialTransactionPolicy
{
    public function viewAny(ClinicUser $user): bool
    {
        return $user->isAdmin();
    }

    public function view(ClinicUser $user, FinancialTransaction $transaction): bool
    {
        return $user->isAdmin()
            && (int) $user->clinic_id === (int) $transaction->clinic_id;
    }

    public function create(ClinicUser $user): bool
    {
        return $user->isAdmin();
    }

    public function update(ClinicUser $user, FinancialTransaction $transaction): bool
    {
        return $this->view($user, $transaction);
    }

    public function delete(ClinicUser $user, FinancialTransaction $transaction): bool
    {
        return $this->view($user, $transaction);
    }

    public function restore(ClinicUser $user, FinancialTransaction $transaction): bool
    {
        return $this->view($user, $transaction);
    }
}
