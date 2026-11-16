<?php

namespace Modules\Media\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Modules\Media\Models\Video;

class VideoRepository
{
    public function __construct(
        protected Video $model,
    ) {}

    public function find(int $id): ?Video
    {
        return $this->model->find($id);
    }

    public function isOwnedByClinic(int $videoId, int $clinicId): bool
    {
        return $this->model
            ->whereKey($videoId)
            ->where('clinic_id', $clinicId)
            ->exists();
    }

    /**
     * @param  list<int>  $videoIds
     * @return list<int>
     */
    public function idsWithPendingMediaProposal(array $videoIds): array
    {
        if (empty($videoIds)) {
            return [];
        }

        return $this->model->newQuery()
            ->whereIn('id', $videoIds)
            ->whereNotNull('metadata->proposed_at')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @return list<int>
     */
    public function allIdsWithPendingMediaProposal(): array
    {
        return $this->model->newQuery()
            ->whereNotNull('metadata->proposed_at')
            ->orderBy('id')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param  list<int>  $videoIds
     * @return Collection<int, Video>
     */
    public function withPendingMediaProposal(array $videoIds): Collection
    {
        if (empty($videoIds)) {
            return new Collection;
        }

        return $this->model->newQuery()
            ->whereIn('id', $videoIds)
            ->whereNotNull('metadata->proposed_at')
            ->orderBy('id')
            ->get();
    }

    public function findOrFail(int $id): Video
    {
        return $this->model->findOrFail($id);
    }

    public function findForUpdate(int $id): Video
    {
        return $this->model->newQuery()->lockForUpdate()->findOrFail($id);
    }

    public function findWith(int $id, array $relations = []): ?Video
    {
        return $this->model->with($relations)->find($id);
    }

    public function all(): Collection
    {
        return $this->model->all();
    }

    public function paginate(int $perPage = 15, array $columns = ['*']): LengthAwarePaginator
    {
        return $this->model->latest()->paginate($perPage, $columns);
    }

    public function create(array $data): Video
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): Video
    {
        $video = $this->model->findOrFail($id);
        $video->update($data);

        return $video->fresh();
    }

    public function delete(int $id): bool
    {
        return (bool) $this->model->findOrFail($id)->delete();
    }

    public function forceDelete(int $id): bool
    {
        $video = $this->model->withTrashed()->findOrFail($id);

        return (bool) $video->forceDelete();
    }

    public function restore(int $id): bool
    {
        $video = $this->model->withTrashed()->findOrFail($id);

        return (bool) $video->restore();
    }

    public function findByUploadable(Model $uploadable): Collection
    {
        return $this->model
            ->where('uploadable_type', $uploadable->getMorphClass())
            ->where('uploadable_id', $uploadable->id)
            ->get();
    }

    public function findByStatus(string $status): Collection
    {
        return $this->model->byStatus($status)->get();
    }

    public function getCompleted(): Collection
    {
        return $this->model->completed()->get();
    }

    public function getFailed(): Collection
    {
        return $this->model->failed()->get();
    }

    public function paginateWithFilters(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (isset($filters['status'])) {
            $query->byStatus($filters['status']);
        }

        if (isset($filters['uploadable_type'])) {
            $query->where('uploadable_type', $filters['uploadable_type']);
        }

        if (isset($filters['uploadable_id'])) {
            $query->where('uploadable_id', $filters['uploadable_id']);
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('filename', 'like', "%{$search}%")
                    ->orWhere('original_filename', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }

    public function count(): int
    {
        return $this->model->count();
    }

    public function getTotalSize(): int
    {
        return (int) $this->model->sum('size');
    }

    public function getByDateRange(string $startDate, string $endDate): Collection
    {
        return $this->model
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();
    }

    public function getRecent(int $limit = 10): Collection
    {
        return $this->model->latest()->limit($limit)->get();
    }

    /**
     * @param  list<int>  $alsoIncludeVideoIds
     */
    public function getAvailableForExercise(array $alsoIncludeVideoIds = []): Collection
    {
        return $this->model
            ->completed()
            ->where(fn ($query) => $query
                ->whereNull('clinic_id')
                ->when($alsoIncludeVideoIds !== [], fn ($query) => $query->orWhereIn('id', $alsoIncludeVideoIds)))
            ->orderBy('original_filename')
            ->get();
    }
}
