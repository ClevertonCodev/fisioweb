<?php

namespace Modules\Cloudflare\Services;

use Illuminate\Support\Facades\Log;
use Modules\Cloudflare\Contracts\SignedMediaUrlInterface;
use Throwable;

class SignedMediaUrlService implements SignedMediaUrlInterface
{
    public function __construct(
        protected ?CloudflareR2Service $files = null,
    ) {
        $this->files ??= new CloudflareR2Service;
    }

    public function forVideo(?string $path): ?string
    {
        return $this->sign($path, self::VIDEO_TTL_SECONDS);
    }

    public function forImage(?string $path): ?string
    {
        return $this->sign($path, self::IMAGE_TTL_SECONDS);
    }

    private function sign(?string $path, int $ttl): ?string
    {
        if (empty($path)) {
            return null;
        }

        try {
            return $this->files->createPresignedDownloadUrl($path, $ttl)['url'];
        } catch (Throwable $e) {
            Log::error('Falha ao assinar link de mídia.', ['exception' => $e::class, 'ttl' => $ttl]);

            return null;
        }
    }
}
