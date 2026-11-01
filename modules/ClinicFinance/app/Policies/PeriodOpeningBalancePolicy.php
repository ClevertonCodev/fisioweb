<?php

namespace Modules\ClinicFinance\Policies;

/** Saldo inicial digitado: só o administrador salva ou apaga. A clínica vem sempre do usuário logado. */
class PeriodOpeningBalancePolicy
{
    public function update($user): bool
    {
        return FinanceAccess::canManageSettings($user);
    }

    public function delete($user): bool
    {
        return FinanceAccess::canManageSettings($user);
    }
}
