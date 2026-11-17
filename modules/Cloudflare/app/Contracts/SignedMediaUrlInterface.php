<?php

namespace Modules\Cloudflare\Contracts;

interface SignedMediaUrlInterface
{
    public const VIDEO_TTL_SECONDS = 1800;

    public const IMAGE_TTL_SECONDS = 300;

    public function forVideo(?string $path): ?string;

    public function forImage(?string $path): ?string;
}
