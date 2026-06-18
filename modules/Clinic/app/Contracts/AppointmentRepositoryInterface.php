<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\Clinic\Models\Appointment;

interface AppointmentRepositoryInterface
{
    public function find(int $id): ?Appointment;

    public function findOrFail(int $id): Appointment;

    public function create(array $data): Appointment;

    public function update(int $id, array $data): Appointment;

    /**
     * Lista consultas para o calendário, filtrando por clínica.
     *
     * Filtros suportados: from, to, clinic_user_id, status.
     */
    public function listForCalendar(int $clinicId, array $filters = []): Collection;
}
