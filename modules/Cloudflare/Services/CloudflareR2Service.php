<?php

namespace Modules\Cloudflare\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Cloudflare\Contracts\FileServiceInterface;

class CloudflareR2Service implements FileServiceInterface
{
    protected string $disk;

    protected string $cdnUrl;

    public function __construct()
    {
        $this->disk = config('cloudflare.r2_disk');
        $this->cdnUrl = config('cloudflare.cdn_url');
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

            logInfo('Arquivo uploadado com sucesso', ['path' => $path]);

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
            logError('Erro ao uploadar arquivo', [
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

    public function deleteFile(string $path): bool
    {
        if (Storage::disk($this->disk)->exists($path)) {
            Storage::disk($this->disk)->delete($path);

            logInfo('Arquivo deletado com sucesso', ['path' => $path]);

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

    public function uploadFromPath(
        string $localPath,
        string $directory = 'files',
        string $originalFilename = '',
    ): array {
        if (! file_exists($localPath)) {
            throw new \RuntimeException("File not found at path: {$localPath}");
        }

        $originalFilename = $originalFilename ?: basename($localPath);
        $extension = pathinfo($localPath, PATHINFO_EXTENSION);
        $filename = Str::uuid().'_'.now()->timestamp.'.'.$extension;
        $path = "{$directory}/{$filename}";

        try {
            $uploaded = Storage::disk($this->disk)->put(
                $path,
                file_get_contents($localPath),
                'public'
            );

            if (! $uploaded) {
                throw new \RuntimeException('Failed to upload file to R2');
            }

            logInfo('Arquivo uploadado com sucesso', ['path' => $path]);

            return [
                'filename' => $filename,
                'original_filename' => $originalFilename,
                'path' => $path,
                'url' => Storage::disk($this->disk)->url($path),
                'cdn_url' => $this->generateCdnUrl($path),
                'mime_type' => mime_content_type($localPath) ?: 'application/octet-stream',
                'size' => filesize($localPath),
            ];
        } catch (\Throwable $e) {
            logError('Erro ao uploadar arquivo de path', [
                'local_path' => $localPath,
                'target_path' => $path,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to upload file: '.$e->getMessage(), 0, $e);
        }
    }

    public function createPresignedUploadUrl(
        string $path,
        string $contentType,
        int $expiresInSeconds = 900,
    ): array {
        try {
            /** @var \Illuminate\Filesystem\AwsS3V3Adapter $adapter */
            $adapter = Storage::disk($this->disk);
            $client = $adapter->getClient();
            $bucket = config('cloudflare.r2.bucket');

            $command = $client->getCommand('PutObject', [
                'Bucket' => $bucket,
                'Key' => $path,
                'ContentType' => $contentType,
            ]);

            $presignedRequest = $client->createPresignedRequest(
                $command,
                "+{$expiresInSeconds} seconds"
            );

            $uploadUrl = (string) $presignedRequest->getUri();

            logInfo('Presigned URL criada com sucesso', [
                'path' => $path,
                'expires_in' => $expiresInSeconds,
            ]);

            return [
                'upload_url' => $uploadUrl,
                'path' => $path,
                'expires_at' => now()->addSeconds($expiresInSeconds)->toISOString(),
            ];
        } catch (\Throwable $e) {
            logError('Erro ao criar presigned URL', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to create presigned URL: '.$e->getMessage(), 0, $e);
        }
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
