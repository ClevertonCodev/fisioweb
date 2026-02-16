<?php

namespace Modules\Admin\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Admin\Contracts\ExerciseServiceInterface;
use Modules\Admin\Models\Exercise;

class ExerciseService implements ExerciseServiceInterface
{
    public function __construct(
        protected ExerciseRepositoryInterface $repository,
    ) {}

    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginate($filters, $perPage);
    }

    public function find(int $id): Exercise
    {
        return $this->repository->findOrFail($id);
    }

    public function create(array $data): Exercise
    {
        $videoId = $data['video_id'] ?? null;
        unset($data['video_id']);

        $exercise = $this->repository->create($data);

        if ($videoId) {
            $this->associateVideo($exercise, (int) $videoId);
        }

        return $exercise;
    }

    public function update(int $id, array $data): Exercise
    {
        $videoId = array_key_exists('video_id', $data) ? $data['video_id'] : null;
        $hasVideoField = array_key_exists('video_id', $data);
        unset($data['video_id']);

        $exercise = $this->repository->update($id, $data);

        if ($hasVideoField) {
            $this->associateVideo($exercise, $videoId ? (int) $videoId : null);
        }

        return $exercise;
    }

    public function associateVideo(Exercise $exercise, ?int $videoId): void
    {
        if ($videoId) {
            $exercise->videos()->sync([$videoId]);
        } else {
            $exercise->videos()->detach();
        }
    }

    public function delete(int $id): bool
    {
        $exercise = $this->repository->findOrFail($id);

        $exercise->videos()->detach();

        return $this->repository->delete($id);
    }
}
