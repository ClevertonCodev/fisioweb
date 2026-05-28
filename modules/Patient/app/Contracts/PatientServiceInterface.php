<?php

namespace Modules\Patient\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Patient\Models\Patient;

interface PatientServiceInterface
{
    public function find(int $id): ?Patient;

    public function list(int $clinicId, array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data, int $clinicId): Patient;

    public function update(int $id, array $data): Patient;

    public function bulkInactivate(int $clinicId, array $ids): int;
}
