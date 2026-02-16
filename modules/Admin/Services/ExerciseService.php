<?php

namespace Modules\Admin\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Admin\Contracts\ExerciseServiceInterface;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\ExerciseMedia;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Models\Video;

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
        // Dissociar vídeos anteriores
        Video::where('uploadable_type', Exercise::class)
            ->where('uploadable_id', $exercise->id)
            ->update(['uploadable_type' => null, 'uploadable_id' => null]);

        // Associar novo vídeo
        if ($videoId) {
            Video::where('id', $videoId)->update([
                'uploadable_type' => Exercise::class,
                'uploadable_id' => $exercise->id,
            ]);
        }
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
