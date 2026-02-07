<?php

namespace Modules\Cloudflare\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Cloudflare\Contracts\ImageServiceInterface;

class CloudflareR2Service implements FileServiceInterface, ImageServiceInterface
{
    protected string $disk;

    protected string $cdnUrl;

    public function __construct()
    {
        $this->disk = config('cloudflare.r2_disk') ?? 'r2';
        $this->cdnUrl = config('cloudflare.cdn_url') ?? '';
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

            if (! $uploaded) {
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

    public function uploadImage(
        UploadedFile $file,
        ?string $directory = null,
    ): array {
        $directory = $directory ?? config('cloudflare.image_directory', 'images');

        return $this->uploadFile($file, $directory);
    }

    public function uploadThumbnail(
        UploadedFile $file,
        ?string $directory = null,
    ): array {
        $directory = $directory ?? config('cloudflare.thumbnail_directory', 'thumbnails');

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
}
