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

    public function getVideoCdnUrl(int $videoId): ?string;

    public function updateMetadata(int $videoId, array $metadata): Video;

    public function getVideosByUploadable(Model $uploadable): Collection;

    public function getAllVideos(int $perPage = 15): LengthAwarePaginator;

    /**
     * @return array{video_id: int, upload_url: string, path: string, expires_at: string, video: array}
     */
    public function requestPresignedUpload(
        string $filename,
        string $mimeType,
        int $size,
        ?string $directory = 'videos',
        ?Model $uploadable = null
    ): array;

    /**
     * Fluxo presigned: confirma que o upload direto foi feito e atualiza o vídeo.
     */
    public function confirmPresignedUpload(int $videoId, ?int $size = null, ?string $mimeType = null): Video;
}
