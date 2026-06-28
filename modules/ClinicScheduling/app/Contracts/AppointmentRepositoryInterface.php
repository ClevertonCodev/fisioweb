<?php

namespace Modules\ClinicScheduling\Contracts;

use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Models\Appointment;

interface AppointmentRepositoryInterface
{
    public function find(int $id): ?Appointment;

    public function findOrFail(int $id): Appointment;

    public function create(array $data): Appointment;

    public function update(int $id, array $data): Appointment;

    public function listForCalendar(int $clinicId, array $filters = []): Collection;
}
