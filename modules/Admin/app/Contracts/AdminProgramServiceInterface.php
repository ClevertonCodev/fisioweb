<?php

namespace Modules\Admin\Contracts;

use Illuminate\Pagination\LengthAwarePaginator;
use Modules\Admin\Models\AdminProgram;

interface AdminProgramServiceInterface
{
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): AdminProgram;

    public function findWithDetail(int $id): AdminProgram;

    public function create(array $data): AdminProgram;

    public function update(int $id, array $data): AdminProgram;

    public function delete(int $id): bool;
}
