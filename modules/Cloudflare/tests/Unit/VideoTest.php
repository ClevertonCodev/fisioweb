<?php

namespace Modules\Cloudflare\Tests\Unit;

use Modules\Cloudflare\Models\Video;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

class VideoTest extends TestCase
{
    #[Test]
    public function status_constants_have_correct_values(): void
    {
        $this->assertEquals('pending', Video::STATUS_PENDING);
        $this->assertEquals('processing', Video::STATUS_PROCESSING);
        $this->assertEquals('completed', Video::STATUS_COMPLETED);
        $this->assertEquals('failed', Video::STATUS_FAILED);
    }

    #[Test]
    public function human_size_returns_zero_when_size_is_null(): void
    {
        $video = new Video();
        $video->size = null;

        $this->assertEquals('0 B', $video->human_size);
    }

    #[Test]
    public function human_size_returns_zero_when_size_is_zero(): void
    {
        $video = new Video();
        $video->size = 0;

        $this->assertEquals('0 B', $video->human_size);
    }

    #[Test]
    public function human_size_returns_bytes(): void
    {
        $video = new Video();
        $video->size = 500;

        $this->assertEquals('500 B', $video->human_size);
    }

    #[Test]
    public function human_size_returns_kilobytes(): void
    {
        $video = new Video();
        $video->size = 1024;

        $this->assertEquals('1 KB', $video->human_size);
    }

    #[Test]
    public function human_size_returns_megabytes(): void
    {
        $video = new Video();
        $video->size = 1048576;

        $this->assertEquals('1 MB', $video->human_size);
    }

    #[Test]
    public function human_size_returns_gigabytes(): void
    {
        $video = new Video();
        $video->size = 1073741824;

        $this->assertEquals('1 GB', $video->human_size);
    }

    #[Test]
    public function human_size_returns_decimal_values(): void
    {
        $video = new Video();
        $video->size = 1536000; // ~1.46 MB

        $this->assertEquals('1.46 MB', $video->human_size);
    }

    #[Test]
    public function human_duration_returns_null_when_duration_is_null(): void
    {
        $video = new Video();
        $video->duration = null;

        $this->assertNull($video->human_duration);
    }

    #[Test]
    public function human_duration_returns_null_when_duration_is_zero(): void
    {
        $video = new Video();
        $video->duration = 0;

        $this->assertNull($video->human_duration);
    }

    #[Test]
    public function human_duration_formats_seconds_only(): void
    {
        $video = new Video();
        $video->duration = 45;

        $this->assertEquals('00:45', $video->human_duration);
    }

    #[Test]
    public function human_duration_formats_minutes_and_seconds(): void
    {
        $video = new Video();
        $video->duration = 125; // 2min 5sec

        $this->assertEquals('02:05', $video->human_duration);
    }

    #[Test]
    public function human_duration_formats_large_durations(): void
    {
        $video = new Video();
        $video->duration = 3661; // 61min 1sec

        $this->assertEquals('61:01', $video->human_duration);
    }

    #[Test]
    public function fillable_contains_expected_fields(): void
    {
        $video = new Video();
        $fillable = $video->getFillable();

        $expectedFields = [
            'filename',
            'original_filename',
            'path',
            'url',
            'cdn_url',
            'mime_type',
            'size',
            'duration',
            'width',
            'height',
            'thumbnail_path',
            'thumbnail_url',
            'status',
            'uploadable_type',
            'uploadable_id',
            'metadata',
        ];

        foreach ($expectedFields as $field) {
            $this->assertContains($field, $fillable, "Campo '{$field}' deveria estar no fillable");
        }
    }

    #[Test]
    public function casts_are_configured_correctly(): void
    {
        $video = new Video();
        $casts = $video->getCasts();

        $this->assertEquals('integer', $casts['size']);
        $this->assertEquals('integer', $casts['duration']);
        $this->assertEquals('integer', $casts['width']);
        $this->assertEquals('integer', $casts['height']);
        $this->assertEquals('array', $casts['metadata']);
    }

    #[Test]
    public function table_name_is_videos(): void
    {
        $video = new Video();

        $this->assertEquals('videos', $video->getTable());
    }
}
