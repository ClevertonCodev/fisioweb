<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Clinic\Models\Clinic;

interface ClinicRepositoryInterface
{
    public function find(int $id): ?Clinic;

    public function findOrFail(int $id): Clinic;

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Clinic;

    public function update(int $id, array $data): Clinic;

    public function delete(int $id): bool;
}
