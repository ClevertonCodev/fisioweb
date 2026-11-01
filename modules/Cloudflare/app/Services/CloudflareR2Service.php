<?php

namespace Modules\Cloudflare\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Cloudflare\Contracts\FileServiceInterface;

class CloudflareR2Service implements FileServiceInterface
{
    /** Tipos que o link assinado deixa abrir na tela; SVG e HTML rodam script, então baixam. */
    private const INLINE_CONTENT_TYPES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/pdf',
    ];

    protected string $disk;

    protected string $cdnUrl;

    public function __construct()
    {
        $this->disk   = config('cloudflare.r2_disk');
        $this->cdnUrl = config('cloudflare.cdn_url');
    }

    public function uploadFile(
        UploadedFile $file,
        string $directory = 'files',
    ): array {
        $filename = $this->generateFilename($file);
        $path     = "{$directory}/{$filename}";

        try {
            $uploaded = Storage::disk($this->disk)->putFileAs(
                $directory,
                $file,
                $filename,
                'public'
            );

            if (!$uploaded) {
                throw new \RuntimeException('Failed to upload file to R2');
            }

            Log::info('Arquivo uploadado com sucesso', ['path' => $path]);

            return [
                'filename'          => $filename,
                'original_filename' => $file->getClientOriginalName(),
                'path'              => $path,
                'url'               => Storage::disk($this->disk)->url($path),
                'cdn_url'           => $this->generateCdnUrl($path),
                'mime_type'         => $file->getMimeType(),
                'size'              => $file->getSize(),
            ];
        } catch (\Throwable $e) {
            Log::error('Erro ao uploadar arquivo', [
                'path'  => $path,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to upload file: ' . $e->getMessage(), 0, $e);
        }
    }

    public function uploadFileAs(
        UploadedFile $file,
        string $directory,
        string $filename,
        string $contentType,
    ): array {
        try {
            // ContentType explícito: sem ele o Flysystem deduz o tipo pela extensão do nome.
            // A visibilidade é a mesma do uploadFile; no R2 quem decide se é público é o bucket.
            $uploaded = Storage::disk($this->disk)->putFileAs(
                $directory,
                $file,
                $filename,
                ['visibility' => 'public', 'ContentType' => $contentType],
            );

            if (!$uploaded) {
                throw new \RuntimeException('Failed to upload file to R2');
            }

            return [
                'filename'          => $filename,
                'original_filename' => $file->getClientOriginalName(),
                'path'              => "{$directory}/{$filename}",
                'mime_type'         => $contentType,
                'size'              => (int) $file->getSize(),
            ];
        } catch (\Throwable $e) {
            // Sem o nome do arquivo no log: o caminho completo abriria o arquivo pelo CDN.
            Log::error('Erro ao uploadar arquivo', [
                'directory' => $directory,
                'error'     => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to upload file: ' . $e->getMessage(), 0, $e);
        }
    }

    public function uploadMultipleFiles(
        array $files,
        string $directory = 'files',
    ): array {
        $uploaded = [];
        $errors   = [];

        foreach ($files as $file) {
            try {
                $uploaded[] = $this->uploadFile($file, $directory);
            } catch (\Throwable $e) {
                $errors[] = [
                    'file'  => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'success' => $uploaded,
            'errors'  => $errors,
        ];
    }

    public function deleteFile(string $path): bool
    {
        if (Storage::disk($this->disk)->exists($path)) {
            Storage::disk($this->disk)->delete($path);

            Log::info('Arquivo deletado com sucesso', ['path' => $path]);

            return true;
        }

        return false;
    }

    public function deletePrivateFile(string $path): bool
    {
        try {
            if (!Storage::disk($this->disk)->exists($path)) {
                return false;
            }

            Storage::disk($this->disk)->delete($path);
        } catch (\Throwable $e) {
            // Sem a exceção original: a mensagem do Flysystem traz o caminho completo.
            throw new \RuntimeException('Failed to delete file in ' . dirname($path) . ': ' . $e::class);
        }

        // Só a pasta: o caminho completo abriria o arquivo pelo CDN.
        Log::info('Arquivo deletado com sucesso', ['directory' => dirname($path)]);

        return true;
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
        if (!file_exists($localPath)) {
            throw new \RuntimeException("File not found at path: {$localPath}");
        }

        $originalFilename = $originalFilename ?: basename($localPath);
        $extension        = pathinfo($localPath, PATHINFO_EXTENSION);
        $filename         = Str::uuid() . '_' . now()->timestamp . '.' . $extension;
        $path             = "{$directory}/{$filename}";

        try {
            $uploaded = Storage::disk($this->disk)->put(
                $path,
                file_get_contents($localPath),
                'public'
            );

            if (!$uploaded) {
                throw new \RuntimeException('Failed to upload file to R2');
            }

            Log::info('Arquivo uploadado com sucesso', ['path' => $path]);

            return [
                'filename'          => $filename,
                'original_filename' => $originalFilename,
                'path'              => $path,
                'url'               => Storage::disk($this->disk)->url($path),
                'cdn_url'           => $this->generateCdnUrl($path),
                'mime_type'         => mime_content_type($localPath) ?: 'application/octet-stream',
                'size'              => filesize($localPath),
            ];
        } catch (\Throwable $e) {
            Log::error('Erro ao uploadar arquivo de path', [
                'local_path'  => $localPath,
                'target_path' => $path,
                'error'       => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to upload file: ' . $e->getMessage(), 0, $e);
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
            $client  = $adapter->getClient();
            $bucket  = config('cloudflare.r2.bucket');

            $command = $client->getCommand('PutObject', [
                'Bucket'      => $bucket,
                'Key'         => $path,
                'ContentType' => $contentType,
            ]);

            $presignedRequest = $client->createPresignedRequest(
                $command,
                "+{$expiresInSeconds} seconds"
            );

            $uploadUrl = (string) $presignedRequest->getUri();

            Log::info('Presigned URL criada com sucesso', [
                'path'       => $path,
                'expires_in' => $expiresInSeconds,
            ]);

            return [
                'upload_url' => $uploadUrl,
                'path'       => $path,
                'expires_at' => now()->addSeconds($expiresInSeconds)->toISOString(),
            ];
        } catch (\Throwable $e) {
            Log::error('Erro ao criar presigned URL', [
                'path'  => $path,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to create presigned URL: ' . $e->getMessage(), 0, $e);
        }
    }

    public function createPresignedDownloadUrl(
        string $path,
        int $expiresInSeconds = 300,
        ?string $downloadFilename = null,
        ?string $contentType = null,
    ): array {
        try {
            /** @var \Illuminate\Filesystem\AwsS3V3Adapter $adapter */
            $adapter = Storage::disk($this->disk);
            $client  = $adapter->getClient();

            $params = [
                'Bucket' => config('cloudflare.r2.bucket'),
                'Key'    => $path,
            ];
            if (!empty($contentType)) {
                $params['ResponseContentType'] = $contentType;
            }
            if (!empty($downloadFilename)) {
                $params['ResponseContentDisposition'] = $this->contentDisposition(
                    $downloadFilename,
                    in_array($contentType, self::INLINE_CONTENT_TYPES, true),
                );
            }

            $presignedRequest = $client->createPresignedRequest(
                $client->getCommand('GetObject', $params),
                "+{$expiresInSeconds} seconds"
            );

            return [
                'url'        => (string) $presignedRequest->getUri(),
                'expires_at' => now()->addSeconds($expiresInSeconds)->toISOString(),
            ];
        } catch (\Throwable $e) {
            // Só a pasta: o caminho completo abriria o arquivo pelo CDN.
            Log::error('Erro ao criar link assinado de leitura', [
                'directory' => dirname($path),
                'error'     => $e->getMessage(),
            ]);

            throw new \RuntimeException('Failed to create presigned download URL: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * `inline` (abre na tela) ou `attachment` (baixa) com o nome original; o `filename*`
     * leva acento e espaço sem quebrar o cabeçalho.
     */
    protected function contentDisposition(string $filename, bool $inline): string
    {
        $ascii = preg_replace('/[^A-Za-z0-9._-]/', '_', Str::ascii($filename)) ?: 'arquivo';

        return sprintf(
            '%s; filename="%s"; filename*=UTF-8\'\'%s',
            $inline ? 'inline' : 'attachment',
            $ascii,
            rawurlencode($filename),
        );
    }

    protected function generateFilename(UploadedFile $file): string
    {
        return Str::uuid() . '_' . now()->timestamp . '.' . $file->getClientOriginalExtension();
    }

    protected function generateCdnUrl(string $path): string
    {
        return rtrim($this->cdnUrl, '/') . '/' . ltrim($path, '/');
    }
}
