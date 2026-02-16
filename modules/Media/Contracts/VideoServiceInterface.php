<?php

namespace Modules\Media\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Modules\Media\Models\Video;

interface VideoServiceInterface
{
    public function dispatchUpload(
        UploadedFile $file,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): array;

    public function dispatchMultipleUploads(
        array $files,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): array;

    public function deleteVideo(int $videoId, bool $forceDelete = false): bool;

    public function getVideo(int $id): ?Video;

    public function getVideoFormatted(int $videoId): array;

    public function getVideoCdnUrl(int $videoId): ?string;

    public function updateMetadata(int $videoId, array $metadata): Video;

    public function getVideosByUploadable(Model $uploadable): Collection;

    public function getAllVideos(int $perPage = 15): LengthAwarePaginator;

    public function requestPresignedUpload(
        string $filename,
        string $mimeType,
        int $size,
        ?string $directory = 'videos',
        ?Model $uploadable = null,
    ): array;

    public function confirmPresignedUpload(int $videoId, ?string $thumbnailPath = null, ?string $originalFilename = null, ?int $duration = null, ?array $metadata = null): array;

    public function updateVideo(int $videoId, array $data): array;

    public function requestPresignedThumbnailReplace(
        int $videoId,
        string $filename,
        string $mimeType,
        int $size,
    ): array;

    public function requestPresignedThumbnailUpload(
        int $videoId,
        string $filename,
        string $mimeType,
        int $size,
    ): array;

    public function getAvailableForExercise(?int $exerciseId = null): Collection;
}
