<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cloudflare R2 Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Cloudflare R2 storage and CDN integration.
    | R2 is S3-compatible, so we use the AWS SDK with R2 endpoints.
    |
    */

    /*
     * R2 Storage Configuration
     */
    'r2_disk' => env('CLOUDFLARE_R2_DISK', 'r2'),

    'r2' => [
        'account_id' => env('CLOUDFLARE_ACCOUNT_ID'),
        'access_key_id' => env('CLOUDFLARE_R2_ACCESS_KEY_ID'),
        'secret_access_key' => env('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
        'bucket' => env('CLOUDFLARE_R2_BUCKET'),
        'region' => env('CLOUDFLARE_R2_REGION', 'auto'),
        'endpoint' => env('CLOUDFLARE_R2_ENDPOINT'), // https://<account_id>.r2.cloudflarestorage.com
    ],

    /*
     * Cloudflare CDN Configuration
     */
    'cdn_url' => env('CLOUDFLARE_CDN_URL'), // Your custom domain with CDN enabled

    /*
     * Video Upload Settings
     */
    'max_video_size' => env('CLOUDFLARE_MAX_VIDEO_SIZE', 524288000), // 500MB default

    'allowed_video_mimes' => [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
        'video/x-flv',
        'video/x-matroska',
    ],

    'allowed_video_extensions' => [
        'mp4',
        'mpeg',
        'mpg',
        'mov',
        'avi',
        'webm',
        'flv',
        'mkv',
    ],

    /*
     * Image Upload Settings
     */
    'max_image_size' => env('CLOUDFLARE_MAX_IMAGE_SIZE', 10485760), // 10MB default

    'allowed_image_mimes' => [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/bmp',
    ],

    'allowed_image_extensions' => [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'svg',
        'bmp',
    ],

    'image_directory' => env('CLOUDFLARE_IMAGE_DIRECTORY', 'images'),

    'video_directory' => env('CLOUDFLARE_VIDEO_DIRECTORY', 'videos'),

    'generate_thumbnails' => env('CLOUDFLARE_GENERATE_THUMBNAILS', false),

    'thumbnail_directory' => env('CLOUDFLARE_THUMBNAIL_DIRECTORY', 'thumbnails'),

    /*
     * CDN Settings
     */
    'cdn_cache_ttl' => env('CLOUDFLARE_CDN_CACHE_TTL', 86400), // 24 hours

    'cdn_enabled' => env('CLOUDFLARE_CDN_ENABLED', true),

    /*
     * Performance Settings
     */
    'chunk_size' => env('CLOUDFLARE_CHUNK_SIZE', 5242880), // 5MB chunks for multipart upload

    'multipart_threshold' => env('CLOUDFLARE_MULTIPART_THRESHOLD', 104857600), // 100MB
];
