<?php

namespace Modules\Media\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Modules\Media\Models\Video;

interface VideoServiceInterface
{
    public function uploadVideo(
        UploadedFile $file,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): Video;

    public function uploadMultipleVideos(
        array $files,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): array;

    public function deleteVideo(int $videoId, bool $forceDelete = false): bool;

    public function getVideo(int $id): ?Video;

    public function getVideoCdnUrl(int $videoId): ?string;

    public function updateMetadata(int $videoId, array $metadata): Video;

    public function getVideosByUploadable(Model $uploadable): Collection;

    public function getAllVideos(int $perPage = 15): LengthAwarePaginator;
}
