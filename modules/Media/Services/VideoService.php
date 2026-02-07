<?php

namespace Modules\Media\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;

class VideoService implements VideoServiceInterface
{
    public function __construct(
        protected FileServiceInterface $fileService,
        protected VideoRepository $videoRepository,
    ) {}

    public function uploadVideo(
        UploadedFile $file,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): Video {
        $directory = $directory ?? config('cloudflare.video_directory', 'videos');

        $video = $this->videoRepository->create([
            'filename' => $file->getClientOriginalName(),
            'original_filename' => $file->getClientOriginalName(),
            'path' => '',
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'status' => Video::STATUS_PROCESSING,
            'uploadable_type' => $uploadable?->getMorphClass(),
            'uploadable_id' => $uploadable?->id,
        ]);

        try {
            $fileData = $this->fileService->uploadFile($file, $directory);

            $video = $this->videoRepository->update($video->id, [
                'filename' => $fileData['filename'],
                'path' => $fileData['path'],
                'url' => $fileData['url'],
                'cdn_url' => $fileData['cdn_url'],
                'status' => Video::STATUS_COMPLETED,
                'metadata' => [
                    'original_name' => $fileData['original_filename'],
                    'mime_type' => $fileData['mime_type'],
                    'size' => $fileData['size'],
                ],
            ]);

            Log::info('Video uploaded successfully', [
                'video_id' => $video->id,
                'path' => $fileData['path'],
            ]);

            return $video;
        } catch (\Throwable $e) {
            $this->videoRepository->update($video->id, [
                'status' => Video::STATUS_FAILED,
                'metadata' => ['error' => $e->getMessage()],
            ]);

            Log::error('Video upload failed', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to upload video: '.$e->getMessage(), 0, $e);
        }
    }

    public function uploadMultipleVideos(
        array $files,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): array {
        $uploadedVideos = [];
        $errors = [];

        foreach ($files as $file) {
            try {
                $uploadedVideos[] = $this->uploadVideo($file, $directory, $uploadable);
            } catch (\Throwable $e) {
                $errors[] = [
                    'file' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'success' => $uploadedVideos,
            'errors' => $errors,
        ];
    }

    public function deleteVideo(int $videoId, bool $forceDelete = false): bool
    {
        $video = $this->videoRepository->find($videoId);

        if (! $video) {
            throw new \RuntimeException("Video with ID {$videoId} not found");
        }

        $this->fileService->deleteFile($video->path);

        if ($video->thumbnail_path) {
            $this->fileService->deleteFile($video->thumbnail_path);
        }

        $forceDelete
            ? $this->videoRepository->forceDelete($videoId)
            : $this->videoRepository->delete($videoId);

        Log::info('Video deleted successfully', [
            'video_id' => $videoId,
            'force_delete' => $forceDelete,
        ]);

        return true;
    }

    public function getVideo(int $id): ?Video
    {
        return $this->videoRepository->find($id);
    }

    public function getVideoCdnUrl(int $videoId): ?string
    {
        return $this->videoRepository->find($videoId)?->cdn_url;
    }

    public function updateMetadata(int $videoId, array $metadata): Video
    {
        $video = $this->videoRepository->find($videoId);

        if (! $video) {
            throw new \RuntimeException("Video with ID {$videoId} not found");
        }

        return $this->videoRepository->update($videoId, [
            'metadata' => array_merge($video->metadata ?? [], $metadata),
        ]);
    }

    public function getVideosByUploadable(Model $uploadable): Collection
    {
        return $this->videoRepository->findByUploadable($uploadable);
    }

    public function getAllVideos(int $perPage = 15): LengthAwarePaginator
    {
        return $this->videoRepository->paginate($perPage);
    }
}
