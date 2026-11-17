<?php

namespace Modules\Cloudflare\Support;

use Modules\Cloudflare\Contracts\SignedMediaUrlInterface;

class SignedMedia
{
    public static function video(?string $path): ?string
    {
        return app(SignedMediaUrlInterface::class)->forVideo($path);
    }

    public static function image(?string $path): ?string
    {
        return app(SignedMediaUrlInterface::class)->forImage($path);
    }
}
