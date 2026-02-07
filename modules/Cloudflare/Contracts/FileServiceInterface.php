<?php

namespace Modules\Cloudflare\Contracts;

use Illuminate\Http\UploadedFile;

interface FileServiceInterface
{
    /**
     * @return array{filename: string, original_filename: string, path: string, url: string, cdn_url: string, mime_type: string, size: int}
     */
    public function uploadFile(
        UploadedFile $file,
        string $directory = 'files',
    ): array;

    /**
     * @return array{success: array, errors: array}
     */
    public function uploadMultipleFiles(
        array $files,
        string $directory = 'files',
    ): array;

    public function deleteFile(string $path): bool;

    public function fileExists(string $path): bool;

    public function getFileUrl(string $path): string;

    public function getFileCdnUrl(string $path): string;
}
