<?php

namespace Modules\Patient\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Patient\Models\Patient;

interface PatientServiceInterface
{
    public function find(int $id): ?Patient;

    public function list(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Cria ou vincula um paciente a uma clínica.
     * Se o CPF já existir no sistema, vincula à clínica.
     * Se não existir, cria um novo patient e vincula.
     */
    public function findOrCreateAndLink(array $data, int $clinicId, int $registeredBy): Patient;

    public function update(int $id, array $data): Patient;

    public function unlinkFromClinic(int $patientId, int $clinicId): bool;
}
