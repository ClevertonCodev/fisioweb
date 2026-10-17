<?php

namespace Modules\ClinicScheduling\Policies;

class ServiceTypePolicy
{
    /** Todos os papéis usam os tipos como atalho ao agendar. */
    public function viewAny($user): bool
    {
        return true;
    }

    /** Editar a lista da clínica: admin (Gate::before) e secretária. */
    public function manage($user): bool
    {
        return $user->isSecretary();
    }
}
