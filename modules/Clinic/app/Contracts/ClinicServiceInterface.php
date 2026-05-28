<?php

namespace Modules\Clinic\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Clinic\Models\Clinic;

interface ClinicServiceInterface
{
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function findById(int $id): Clinic;

    public function create(array $data): Clinic;

    public function update(int $id, array $data): Clinic;

    public function delete(int $id): bool;
}
