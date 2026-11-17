<?php

namespace Modules\Media\Support;

use Modules\Cloudflare\Support\SignedMedia;

class VideoMetadataPresenter
{
    /**
     * @param  array<string, mixed>|null  $metadata
     * @return array{reference_images: list<array<string, mixed>>}|null
     */
    public static function forPublic(?array $metadata): ?array
    {
        if (is_null($metadata)) {
            return null;
        }

        return [
            'reference_images' => self::images($metadata['reference_images'] ?? []),
        ];
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     * @return array<string, mixed>|null
     */
    public static function forAdmin(?array $metadata): ?array
    {
        if (is_null($metadata)) {
            return null;
        }

        $presented = [];

        foreach ($metadata as $key => $value) {
            if (!is_string($key) || self::isPathKey($key)) {
                continue;
            }

            if ($key === 'reference_images' || $key === 'proposed_reference_images') {
                $presented[$key] = self::images(is_array($value) ? $value : []);

                continue;
            }

            $presented[$key] = $value;
        }

        if (!empty($metadata['proposed_thumbnail_path']) && is_string($metadata['proposed_thumbnail_path'])) {
            $presented['proposed_thumbnail_url'] = SignedMedia::video($metadata['proposed_thumbnail_path']);
        }

        return $presented;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public static function images(mixed $images): array
    {
        if (!is_array($images)) {
            return [];
        }

        $presented = [];

        foreach ($images as $image) {
            if (!is_array($image)) {
                continue;
            }

            $path        = $image['file_path'] ?? null;
            $presented[] = [
                'url'               => is_string($path) && !empty($path) ? SignedMedia::image($path) : null,
                'original_filename' => (string) ($image['original_filename'] ?? (is_string($path) ? basename($path) : '')),
                'mime_type'         => (string) ($image['mime_type'] ?? 'image/jpeg'),
                'size'              => (int) ($image['size'] ?? 0),
            ];
        }

        return $presented;
    }

    private static function isPathKey(string $key): bool
    {
        return $key === 'file_path'
            || str_ends_with($key, '_path')
            || str_ends_with($key, '_paths');
    }
}
