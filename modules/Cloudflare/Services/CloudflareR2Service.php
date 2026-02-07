<?php

namespace Modules\Cloudflare\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Cloudflare\Contracts\ImageServiceInterface;
use Modules\Cloudflare\Contracts\VideoServiceInterface;
use Modules\Cloudflare\Models\Video;
use Modules\Cloudflare\Repositories\VideoRepository;

class CloudflareR2Service implements FileServiceInterface, ImageServiceInterface, VideoServiceInterface
{
    protected string $disk;

    protected string $cdnUrl;

    public function __construct(
        protected VideoRepository $videoRepository,
    ) {
        $this->disk = config('cloudflare.r2_disk') ?? 'r2';
        $this->cdnUrl = config('cloudflare.cdn_url') ?? '';
    }

    public function uploadVideo(
        UploadedFile $file,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): Video {
        $filename = $this->generateFilename($file);
        $directory = $directory ?? config('cloudflare.video_directory', 'videos');
        $path = "{$directory}/{$filename}";

        $video = $this->videoRepository->create([
            'filename' => $filename,
            'original_filename' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'status' => Video::STATUS_PROCESSING,
            'uploadable_type' => $uploadable?->getMorphClass(),
            'uploadable_id' => $uploadable?->id,
        ]);

        try {
            $uploaded = Storage::disk($this->disk)->putFileAs(
                $directory,
                $file,
                $filename,
                'public'
            );

            if (!$uploaded) {
                throw new \RuntimeException('Failed to upload video to R2');
            }

            $video = $this->videoRepository->update($video->id, [
                'url' => Storage::disk($this->disk)->url($path),
                'cdn_url' => $this->generateCdnUrl($path),
                'status' => Video::STATUS_COMPLETED,
                'metadata' => $this->extractVideoMetadata($file),
            ]);

            Log::info('Video uploaded successfully', [
                'video_id' => $video->id,
                'path' => $path,
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

        if (!$video) {
            throw new \RuntimeException("Video with ID {$videoId} not found");
        }

        if (Storage::disk($this->disk)->exists($video->path)) {
            Storage::disk($this->disk)->delete($video->path);
        }

        if ($video->thumbnail_path && Storage::disk($this->disk)->exists($video->thumbnail_path)) {
            Storage::disk($this->disk)->delete($video->thumbnail_path);
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

        if (!$video) {
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

    public function uploadFile(
        UploadedFile $file,
        string $directory = 'files',
    ): array {
        $filename = $this->generateFilename($file);
        $path = "{$directory}/{$filename}";

        try {
            $uploaded = Storage::disk($this->disk)->putFileAs(
                $directory,
                $file,
                $filename,
                'public'
            );

            if (!$uploaded) {
                throw new \RuntimeException('Failed to upload file to R2');
            }

            Log::info('File uploaded successfully', ['path' => $path]);

            return [
                'filename' => $filename,
                'original_filename' => $file->getClientOriginalName(),
                'path' => $path,
                'url' => Storage::disk($this->disk)->url($path),
                'cdn_url' => $this->generateCdnUrl($path),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
            ];
        } catch (\Throwable $e) {
            Log::error('File upload failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to upload file: '.$e->getMessage(), 0, $e);
        }
    }

    public function uploadMultipleFiles(
        array $files,
        string $directory = 'files',
    ): array {
        $uploaded = [];
        $errors = [];

        foreach ($files as $file) {
            try {
                $uploaded[] = $this->uploadFile($file, $directory);
            } catch (\Throwable $e) {
                $errors[] = [
                    'file' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'success' => $uploaded,
            'errors' => $errors,
        ];
    }

    public function uploadThumbnail(
        UploadedFile $file,
        ?string $directory = null,
    ): array {
        $directory = $directory ?? config('cloudflare.thumbnail_directory', 'thumbnails');

        return $this->uploadFile($file, $directory);
    }

    public function uploadImage(
        UploadedFile $file,
        ?string $directory = null,
    ): array {
        $directory = $directory ?? config('cloudflare.image_directory', 'images');

        return $this->uploadFile($file, $directory);
    }

    public function deleteFile(string $path): bool
    {
        if (Storage::disk($this->disk)->exists($path)) {
            Storage::disk($this->disk)->delete($path);

            Log::info('File deleted successfully', ['path' => $path]);

            return true;
        }

        return false;
    }

    public function fileExists(string $path): bool
    {
        return Storage::disk($this->disk)->exists($path);
    }

    public function getFileUrl(string $path): string
    {
        return Storage::disk($this->disk)->url($path);
    }

    public function getFileCdnUrl(string $path): string
    {
        return $this->generateCdnUrl($path);
    }

    protected function generateFilename(UploadedFile $file): string
    {
        return Str::uuid().'_'.now()->timestamp.'.'.$file->getClientOriginalExtension();
    }

    protected function generateCdnUrl(string $path): string
    {
        return rtrim($this->cdnUrl, '/').'/'.ltrim($path, '/');
    }

    protected function extractVideoMetadata(UploadedFile $file): array
    {
        return [
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ];
    }
}
