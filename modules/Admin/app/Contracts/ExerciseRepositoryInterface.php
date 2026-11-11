<?php

namespace Modules\Admin\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Models\Exercise;

interface ExerciseRepositoryInterface
{
    public function find(int $id): ?Exercise;

    public function findOrFail(int $id): Exercise;

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    public function create(array $data): Exercise;

    public function update(int $id, array $data): Exercise;

    public function delete(int $id): bool;

    /**
     * @return list<int>
     */
    public function linkedVideoIds(int $exerciseId): array;

    public function videoHasExerciseBeyondOwnerReview(int $videoId, int $ownerClinicId): bool;
}
