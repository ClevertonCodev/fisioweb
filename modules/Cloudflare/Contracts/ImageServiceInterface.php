<?php

namespace Modules\Cloudflare\Contracts;

use Illuminate\Http\UploadedFile;

interface ImageServiceInterface
{
    /**
     * @return array{filename: string, original_filename: string, path: string, url: string, cdn_url: string, mime_type: string, size: int}
     */
    public function uploadImage(
        UploadedFile $file,
        ?string $directory = null,
    ): array;

    /**
     * @return array{filename: string, original_filename: string, path: string, url: string, cdn_url: string, mime_type: string, size: int}
     */
    public function uploadThumbnail(
        UploadedFile $file,
        ?string $directory = null,
    ): array;
}
