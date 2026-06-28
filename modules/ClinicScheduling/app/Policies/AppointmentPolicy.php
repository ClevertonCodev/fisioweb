<?php

namespace Modules\ClinicScheduling\Policies;

use Modules\ClinicScheduling\Models\Appointment;

class AppointmentPolicy
{
    public function viewAny($user): bool
    {
        return true; // Service filtra o conjunto conforme o papel (FR-009)
    }

    public function view($user, Appointment $appointment): bool
    {
        return $this->canManageRecord($user, $appointment);
    }

    public function create($user): bool
    {
        // admin/secretário marcam para qualquer fisio; fisioterapeuta marca p/ si
        // (a restrição de clinic_user_id é reforçada no Request/Service — FR-010)
        return $this->managesAll($user) || $user->isPhysiotherapist();
    }

    public function update($user, Appointment $appointment): bool
    {
        return $this->canManageRecord($user, $appointment);
    }

    public function cancel($user, Appointment $appointment): bool
    {
        return $this->canManageRecord($user, $appointment);
    }

    /**
     * Acesso ao registro: sempre dentro da própria clínica (isolamento
     * multi-tenant — FR-021). Admin/secretário gerenciam toda a clínica;
     * fisioterapeuta apenas as consultas atribuídas a ele.
     */
    private function canManageRecord($user, Appointment $appointment): bool
    {
        if ($appointment->clinic_id !== $user->clinic_id) {
            return false;
        }

        return $this->managesAll($user) || $appointment->clinic_user_id === $user->id;
    }

    /** Admin e secretário gerenciam a agenda de toda a clínica. */
    private function managesAll($user): bool
    {
        return $user->isAdmin() || $user->isSecretary();
    }
}
