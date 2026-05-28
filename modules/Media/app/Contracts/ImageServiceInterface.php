<?php

namespace Modules\Media\Contracts;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;

interface ImageServiceInterface
{
    /**
     * @return array{filename: string, original_filename: string, path: string, url: string, cdn_url: string, mime_type: string, size: int}
     */
    public function uploadImage(
        UploadedFile $file,
        ?string $directory = null,
        ?Model $uploadable = null,
    ): array;

    /**
     * @return array{success: array, errors: array}
     */
    public function uploadMultipleImages(
        array $files,
        ?string $directory = null,
        ?Model $uploadable = null,
    ): array;

    public function deleteImage(int $imageId, bool $forceDelete = false): bool;

    public function getImage(int $id): ?Model;

    public function getImageCdnUrl(int $imageId): ?string;

    public function getImagesByUploadable(Model $uploadable): Collection;

    public function getAllImages(int $perPage = 15): LengthAwarePaginator;
}
