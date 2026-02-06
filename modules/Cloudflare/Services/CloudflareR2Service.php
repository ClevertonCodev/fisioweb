<?php

namespace Modules\Cloudflare\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Cloudflare\Models\Video;
use Modules\Cloudflare\Repositories\VideoRepository;

class CloudflareR2Service
{
    protected VideoRepository $videoRepository;
    protected string $disk;
    protected string $cdnUrl;

    public function __construct(VideoRepository $videoRepository)
    {
        $this->videoRepository = $videoRepository;
        $this->disk = config('cloudflare.r2_disk', 'r2');
        $this->cdnUrl = config('cloudflare.cdn_url');
    }

    /**
     * Upload a video file to Cloudflare R2.
     *
     * @param mixed|null $uploadable
     *
     * @throws \Exception
     */
    public function uploadVideo(
        UploadedFile $file,
        ?string $directory = 'videos',
        $uploadable = null
    ): Video {
        try {
            // Validate video file
            $this->validateVideo($file);

            // Generate unique filename
            $filename = $this->generateFilename($file);
            $path = $directory ? "{$directory}/{$filename}" : $filename;

            // Create video record with pending status
            $video = $this->videoRepository->create([
                'filename' => $filename,
                'original_filename' => $file->getClientOriginalName(),
                'path' => $path,
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'status' => Video::STATUS_PROCESSING,
                'uploadable_type' => $uploadable ? get_class($uploadable) : null,
                'uploadable_id' => $uploadable?->id,
            ]);

            // Upload file to R2
            $uploaded = Storage::disk($this->disk)->putFileAs(
                $directory,
                $file,
                $filename,
                'public'
            );

            if (!$uploaded) {
                throw new \Exception('Failed to upload video to R2');
            }

            // Get file URL from R2
            $url = Storage::disk($this->disk)->url($path);

            // Generate CDN URL
            $cdnUrl = $this->generateCdnUrl($path);

            // Extract video metadata (if available)
            $metadata = $this->extractVideoMetadata($file);

            // Update video record
            $video = $this->videoRepository->update($video->id, [
                'url' => $url,
                'cdn_url' => $cdnUrl,
                'status' => Video::STATUS_COMPLETED,
                'width' => $metadata['width'] ?? null,
                'height' => $metadata['height'] ?? null,
                'duration' => $metadata['duration'] ?? null,
                'metadata' => $metadata,
            ]);

            Log::info('Video uploaded successfully', [
                'video_id' => $video->id,
                'filename' => $filename,
                'path' => $path,
            ]);

            return $video;
        } catch (\Exception $e) {
            Log::error('Video upload failed', [
                'error' => $e->getMessage(),
                'file' => $file->getClientOriginalName(),
            ]);

            // Update video status to failed if record exists
            if (isset($video)) {
                $this->videoRepository->update($video->id, [
                    'status' => Video::STATUS_FAILED,
                    'metadata' => ['error' => $e->getMessage()],
                ]);
            }

            throw $e;
        }
    }

    /**
     * Upload multiple videos.
     *
     * @param mixed|null $uploadable
     */
    public function uploadMultipleVideos(
        array $files,
        ?string $directory = 'videos',
        $uploadable = null
    ): array {
        $uploadedVideos = [];
        $errors = [];

        foreach ($files as $file) {
            try {
                $uploadedVideos[] = $this->uploadVideo($file, $directory, $uploadable);
            } catch (\Exception $e) {
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

    /**
     * Delete a video from R2 and database.
     *
     * @throws \Exception
     */
    public function deleteVideo(int $videoId, bool $forceDelete = false): bool
    {
        try {
            $video = $this->videoRepository->find($videoId);

            if (!$video) {
                throw new \Exception('Video not found');
            }

            // Delete from R2
            if (Storage::disk($this->disk)->exists($video->path)) {
                Storage::disk($this->disk)->delete($video->path);
            }

            // Delete thumbnail if exists
            if ($video->thumbnail_path && Storage::disk($this->disk)->exists($video->thumbnail_path)) {
                Storage::disk($this->disk)->delete($video->thumbnail_path);
            }

            // Delete from database
            if ($forceDelete) {
                $this->videoRepository->forceDelete($videoId);
            } else {
                $this->videoRepository->delete($videoId);
            }

            Log::info('Video deleted successfully', [
                'video_id' => $videoId,
                'force_delete' => $forceDelete,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Video deletion failed', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Get video by ID.
     */
    public function getVideo(int $id): ?Video
    {
        return $this->videoRepository->find($id);
    }

    /**
     * Get video CDN URL.
     */
    public function getVideoCdnUrl(int $videoId): ?string
    {
        $video = $this->videoRepository->find($videoId);

        return $video?->cdn_url;
    }

    /**
     * Update video metadata.
     */
    public function updateMetadata(int $videoId, array $metadata): Video
    {
        return $this->videoRepository->update($videoId, [
            'metadata' => array_merge(
                $this->videoRepository->find($videoId)->metadata ?? [],
                $metadata
            ),
        ]);
    }

    /**
     * Generate a unique filename for the video.
     */
    protected function generateFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $uuid = Str::uuid();
        $timestamp = now()->timestamp;

        return "{$uuid}_{$timestamp}.{$extension}";
    }

    /**
     * Generate CDN URL for the video.
     */
    protected function generateCdnUrl(string $path): string
    {
        return rtrim($this->cdnUrl, '/').'/'.ltrim($path, '/');
    }

    /**
     * Validate video file.
     *
     * @throws \Exception
     */
    protected function validateVideo(UploadedFile $file): void
    {
        $allowedMimeTypes = config('cloudflare.allowed_video_mimes', [
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/webm',
        ]);

        $maxSize = config('cloudflare.max_video_size', 524288000); // 500MB default

        if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
            throw new \Exception('Invalid video format. Allowed formats: '.implode(', ', $allowedMimeTypes));
        }

        if ($file->getSize() > $maxSize) {
            throw new \Exception('Video file size exceeds maximum allowed size of '.($maxSize / 1048576).'MB');
        }

        if (!$file->isValid()) {
            throw new \Exception('Invalid video file upload');
        }
    }

    /**
     * Extract video metadata (basic implementation)
     * For advanced metadata extraction, consider using FFmpeg.
     */
    protected function extractVideoMetadata(UploadedFile $file): array
    {
        $metadata = [
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ];

        // Add more metadata extraction here using FFmpeg or similar
        // Example: duration, resolution, codec, etc.

        return $metadata;
    }

    /**
     * Get videos by uploadable model.
     *
     * @return \Illuminate\Support\Collection
     */
    public function getVideosByUploadable($uploadable)
    {
        return $this->videoRepository->findByUploadable($uploadable);
    }

    /**
     * Get all videos with pagination.
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getAllVideos(int $perPage = 15)
    {
        return $this->videoRepository->paginate($perPage);
    }
}
