<?php

namespace Modules\ClinicScheduling\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;

interface AppointmentServiceInterface
{
    public function create(array $data): Appointment;

    public function update(int $id, array $data): Appointment;

    public function updateStatus(int $id, AppointmentStatus $status): Appointment;

    public function cancel(int $id): Appointment;

    /**
     * Lista as consultas visíveis para o usuário autenticado (guard clinic).
     * O tipo do usuário não é anotado para evitar import cross-module de Model.
     */
    public function listForUser($user, array $filters = []): Collection;
}
