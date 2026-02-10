<?php

namespace Modules\Admin\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Admin\Contracts\ExerciseServiceInterface;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\ExerciseMedia;
use Modules\Cloudflare\Contracts\FileServiceInterface;

class ExerciseService implements ExerciseServiceInterface
{
    public function __construct(
        protected ExerciseRepositoryInterface $repository,
        protected FileServiceInterface $fileService,
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
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): Exercise
    {
        return $this->repository->update($id, $data);
    }

    public function delete(int $id): bool
    {
        $exercise = $this->repository->findOrFail($id);

        foreach ($exercise->media as $media) {
            $this->fileService->deleteFile($media->file_path);
        }

        foreach ($exercise->videos as $video) {
            if ($video->path) {
                $this->fileService->deleteFile($video->path);
            }
        }

        return $this->repository->delete($id);
    }

    public function uploadMedia(Exercise $exercise, array $files, string $type): array
    {
        $uploaded = [];
        $directory = "exercises/{$exercise->id}/{$type}s";
        $lastOrder = $exercise->media()->where('type', $type)->max('sort_order') ?? -1;

        foreach ($files as $file) {
            $result = $this->fileService->uploadFile($file, $directory);

            $media = ExerciseMedia::create([
                'exercise_id' => $exercise->id,
                'type' => $type,
                'file_path' => $result['path'],
                'cdn_url' => $result['cdn_url'] ?? null,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'sort_order' => ++$lastOrder,
            ]);

            $uploaded[] = $media;
        }

        return $uploaded;
    }

    public function deleteMedia(int $mediaId): bool
    {
        $media = ExerciseMedia::findOrFail($mediaId);

        $this->fileService->deleteFile($media->file_path);

        return (bool) $media->delete();
    }
}
