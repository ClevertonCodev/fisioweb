<?php

namespace Modules\Media\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Contracts\ImageServiceInterface;

class PhotoService implements ImageServiceInterface
{
    public function __construct(
        protected FileServiceInterface $fileService,
    ) {}

    public function uploadImage(
        UploadedFile $file,
        ?string $directory = null,
        ?Model $uploadable = null,
    ): array {
        $directory = $directory ?? config('cloudflare.image_directory', 'images');

        return $this->fileService->uploadFile($file, $directory);
    }

    public function uploadThumbnail(
        UploadedFile $file,
        ?string $directory = null,
    ): array {
        $directory = $directory ?? config('cloudflare.thumbnail_directory', 'thumbnails');

        return $this->fileService->uploadFile($file, $directory);
    }

    public function uploadMultipleImages(
        array $files,
        ?string $directory = null,
        ?Model $uploadable = null,
    ): array {
        $directory = $directory ?? config('cloudflare.image_directory', 'images');

        return $this->fileService->uploadMultipleFiles($files, $directory);
    }

    public function deleteImage(int $imageId, bool $forceDelete = false): bool
    {
        // TODO: Implementar quando o model Photo for criado
        throw new \RuntimeException('PhotoService::deleteImage() não implementado. Crie o model Photo primeiro.');
    }

    public function getImage(int $id): ?Model
    {
        // TODO: Implementar quando o model Photo for criado
        throw new \RuntimeException('PhotoService::getImage() não implementado. Crie o model Photo primeiro.');
    }

    public function getImageCdnUrl(int $imageId): ?string
    {
        // TODO: Implementar quando o model Photo for criado
        throw new \RuntimeException('PhotoService::getImageCdnUrl() não implementado. Crie o model Photo primeiro.');
    }

    public function getImagesByUploadable(Model $uploadable): Collection
    {
        // TODO: Implementar quando o model Photo for criado
        throw new \RuntimeException('PhotoService::getImagesByUploadable() não implementado. Crie o model Photo primeiro.');
    }

    public function getAllImages(int $perPage = 15): LengthAwarePaginator
    {
        // TODO: Implementar quando o model Photo for criado
        throw new \RuntimeException('PhotoService::getAllImages() não implementado. Crie o model Photo primeiro.');
    }
}
