<?php

namespace Modules\Admin\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Models\Exercise;

interface ExerciseServiceInterface
{
    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function find(int $id): Exercise;

    public function create(array $data): Exercise;

    public function update(int $id, array $data): Exercise;

    public function delete(int $id): bool;

    public function associateVideo(Exercise $exercise, ?int $videoId): void;
}
