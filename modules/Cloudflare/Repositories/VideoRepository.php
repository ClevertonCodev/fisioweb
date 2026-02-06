<?php

namespace Modules\Cloudflare\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Modules\Cloudflare\Models\Video;

class VideoRepository
{
    protected Video $model;

    public function __construct(Video $model)
    {
        $this->model = $model;
    }

    /**
     * Find a video by ID.
     */
    public function find(int $id): ?Video
    {
        return $this->model->find($id);
    }

    /**
     * Find a video by ID with relations.
     */
    public function findWith(int $id, array $relations = []): ?Video
    {
        return $this->model->with($relations)->find($id);
    }

    /**
     * Get all videos.
     */
    public function all(): Collection
    {
        return $this->model->all();
    }

    /**
     * Get videos with pagination.
     */
    public function paginate(int $perPage = 15, array $columns = ['*']): LengthAwarePaginator
    {
        return $this->model->latest()->paginate($perPage, $columns);
    }

    /**
     * Create a new video record.
     */
    public function create(array $data): Video
    {
        return $this->model->create($data);
    }

    /**
     * Update a video record.
     */
    public function update(int $id, array $data): Video
    {
        $video = $this->find($id);
        $video->update($data);

        return $video->fresh();
    }

    /**
     * Delete a video (soft delete).
     */
    public function delete(int $id): bool
    {
        $video = $this->find($id);

        return $video ? $video->delete() : false;
    }

    /**
     * Force delete a video.
     */
    public function forceDelete(int $id): bool
    {
        $video = $this->model->withTrashed()->find($id);

        return $video ? $video->forceDelete() : false;
    }

    /**
     * Restore a soft deleted video.
     */
    public function restore(int $id): bool
    {
        $video = $this->model->withTrashed()->find($id);

        return $video ? $video->restore() : false;
    }

    /**
     * Find videos by uploadable model (polymorphic relationship).
     */
    public function findByUploadable($uploadable): Collection
    {
        return $this->model
            ->where('uploadable_type', get_class($uploadable))
            ->where('uploadable_id', $uploadable->id)
            ->get();
    }

    /**
     * Find videos by status.
     */
    public function findByStatus(string $status): Collection
    {
        return $this->model->where('status', $status)->get();
    }

    /**
     * Get completed videos.
     */
    public function getCompleted(): Collection
    {
        return $this->model->completed()->get();
    }

    /**
     * Get failed videos.
     */
    public function getFailed(): Collection
    {
        return $this->model->failed()->get();
    }

    /**
     * Get videos with pagination and filters.
     */
    public function paginateWithFilters(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->model->query();

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
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

    /**
     * Get total videos count.
     */
    public function count(): int
    {
        return $this->model->count();
    }

    /**
     * Get total size of all videos in bytes.
     */
    public function getTotalSize(): int
    {
        return $this->model->sum('size');
    }

    /**
     * Get videos by date range.
     */
    public function getByDateRange(string $startDate, string $endDate): Collection
    {
        return $this->model
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();
    }

    /**
     * Get recent videos.
     */
    public function getRecent(int $limit = 10): Collection
    {
        return $this->model->latest()->limit($limit)->get();
    }
}
