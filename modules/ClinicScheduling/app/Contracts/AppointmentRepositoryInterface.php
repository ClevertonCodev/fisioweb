<?php

namespace Modules\ClinicScheduling\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Modules\ClinicScheduling\Models\Appointment;

interface AppointmentRepositoryInterface
{
    public function find(int $id): ?Appointment;

    public function findOrFail(int $id): Appointment;

    public function create(array $data): Appointment;

    public function update(int $id, array $data): Appointment;

    public function listForCalendar(int $clinicId, array $filters = []): Collection;

    public function patientHasAppointmentInClinic(int $clinicId, int $patientId): bool;

    /** O profissional tem consulta não cancelada com o paciente (passada ou futura)? */
    public function clinicUserAttendsPatient(int $clinicId, int $clinicUserId, int $patientId): bool;

    /**
     * Consultas do paciente na clínica, de qualquer profissional, da mais
     * recente para a mais antiga.
     */
    public function paginateForPatient(int $clinicId, int $patientId, int $perPage): LengthAwarePaginator;
}
