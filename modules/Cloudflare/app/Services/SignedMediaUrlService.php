<?php

namespace Modules\Cloudflare\Services;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Cloudflare\Contracts\SignedMediaUrlInterface;
use Throwable;

class SignedMediaUrlService implements SignedMediaUrlInterface
{
    /** Parte do prazo em que o link sai igual: o navegador reaproveita o cache e o link ainda vale ao menos 80% do prazo. */
    private const WINDOW_DIVISOR = 5;

    public function __construct(
        private readonly FileServiceInterface $files,
    ) {}

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
            return $this->files->createPresignedDownloadUrl($path, $ttl, null, null, $this->windowStart($ttl))['url'];
        } catch (Throwable $e) {
            Log::error('Falha ao assinar link de mídia.', ['exception' => $e::class, 'ttl' => $ttl]);

            return null;
        }
    }

    private function windowStart(int $ttl): Carbon
    {
        $window = intdiv($ttl, self::WINDOW_DIVISOR);
        $now    = now()->getTimestamp();

        return Carbon::createFromTimestamp($now - ($now % $window));
    }
}
