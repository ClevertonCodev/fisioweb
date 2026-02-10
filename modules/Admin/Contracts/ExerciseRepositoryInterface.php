<?php

namespace Modules\Admin\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Models\Exercise;

interface ExerciseRepositoryInterface
{
    public function find(int $id): ?Exercise;

    public function findOrFail(int $id): Exercise;

    public function findWithRelations(int $id, array $relations = []): ?Exercise;

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Exercise;

    public function update(int $id, array $data): Exercise;

    public function delete(int $id): bool;

    public function restore(int $id): bool;
}
