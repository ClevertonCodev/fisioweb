<?php

namespace Modules\Patient\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Patient\Models\Patient;

interface PatientRepositoryInterface
{
    public function find(int $id): ?Patient;

    public function findOrFail(int $id): Patient;

    public function findByEmailOrCpf(string $identifier): ?Patient;

    public function paginateByClinic(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Patient;

    public function update(int $id, array $data): Patient;

    public function linkToClinic(int $patientId, int $clinicId, ?int $registeredBy): void;

    public function unlinkFromClinic(int $patientId, int $clinicId): bool;

    public function isLinkedToClinic(int $patientId, int $clinicId): bool;
}
