<?php

namespace Modules\ClinicFinance\Policies;

/**
 * Comprovante do lançamento: administrador (também pelo Gate::before) e secretária.
 * Confere só o papel; a posse do lançamento e do comprovante fica no Service
 * (404 se for de outra clínica ou estiver na lixeira).
 */
class FinancialAttachmentPolicy
{
    public function viewAny($user): bool
    {
        return FinanceAccess::canUse($user);
    }

    public function create($user): bool
    {
        return FinanceAccess::canUse($user);
    }

    public function delete($user): bool
    {
        return FinanceAccess::canUse($user);
    }
}
