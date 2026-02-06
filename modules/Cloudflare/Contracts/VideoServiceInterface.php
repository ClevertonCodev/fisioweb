<?php

namespace Modules\Cloudflare\Contracts;

use Illuminate\Http\UploadedFile;
use Modules\Cloudflare\Models\Video;

interface VideoServiceInterface
{
    /**
     * Upload a video file.
     *
     * @param mixed|null $uploadable
     */
    public function uploadVideo(
        UploadedFile $file,
        ?string $directory = 'videos',
        $uploadable = null
    ): Video;

    /**
     * Upload multiple videos.
     *
     * @param mixed|null $uploadable
     */
    public function uploadMultipleVideos(
        array $files,
        ?string $directory = 'videos',
        $uploadable = null
    ): array;

    /**
     * Delete a video.
     */
    public function deleteVideo(int $videoId, bool $forceDelete = false): bool;

    /**
     * Get video by ID.
     */
    public function getVideo(int $id): ?Video;

    /**
     * Get video CDN URL.
     */
    public function getVideoCdnUrl(int $videoId): ?string;

    /**
     * Update video metadata.
     */
    public function updateMetadata(int $videoId, array $metadata): Video;
}
