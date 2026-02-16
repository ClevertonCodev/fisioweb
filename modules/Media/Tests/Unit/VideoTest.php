<?php

namespace Modules\Media\Tests\Unit;

use Modules\Media\Models\Video;
use PHPUnit\Framework\TestCase;

class VideoTest extends TestCase
{
    public function test_should_return_zero_for_human_size_when_size_is_null(): void
    {
        $video       = new Video;
        $video->size = null;

        $this->assertEquals('0 B', $video->human_size);
    }

    public function test_should_return_zero_for_human_size_when_size_is_zero(): void
    {
        $video       = new Video;
        $video->size = 0;

        $this->assertEquals('0 B', $video->human_size);
    }

    public function test_should_return_bytes_for_human_size(): void
    {
        $video       = new Video;
        $video->size = 500;

        $this->assertEquals('500 B', $video->human_size);
    }

    public function test_should_return_kilobytes_for_human_size(): void
    {
        $video       = new Video;
        $video->size = 1024;

        $this->assertEquals('1 KB', $video->human_size);
    }

    public function test_should_return_megabytes_for_human_size(): void
    {
        $video       = new Video;
        $video->size = 1048576;

        $this->assertEquals('1 MB', $video->human_size);
    }

    public function test_should_return_gigabytes_for_human_size(): void
    {
        $video       = new Video;
        $video->size = 1073741824;

        $this->assertEquals('1 GB', $video->human_size);
    }

    public function test_should_return_decimal_values_for_human_size(): void
    {
        $video       = new Video;
        $video->size = 1536000; // ~1.46 MB

        $this->assertEquals('1.46 MB', $video->human_size);
    }

    public function test_should_return_null_for_human_duration_when_duration_is_null(): void
    {
        $video           = new Video;
        $video->duration = null;

        $this->assertNull($video->human_duration);
    }

    public function test_should_return_null_for_human_duration_when_duration_is_zero(): void
    {
        $video           = new Video;
        $video->duration = 0;

        $this->assertNull($video->human_duration);
    }

    public function test_should_format_seconds_only_for_human_duration(): void
    {
        $video           = new Video;
        $video->duration = 45;

        $this->assertEquals('00:45', $video->human_duration);
    }

    public function test_should_format_minutes_and_seconds_for_human_duration(): void
    {
        $video           = new Video;
        $video->duration = 125; // 2min 5sec

        $this->assertEquals('02:05', $video->human_duration);
    }

    public function test_should_format_large_durations_for_human_duration(): void
    {
        $video           = new Video;
        $video->duration = 3661; // 61min 1sec

        $this->assertEquals('61:01', $video->human_duration);
    }

    public function test_should_contain_expected_fillable_fields(): void
    {
        $video    = new Video;
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

    public function test_should_have_casts_configured_correctly(): void
    {
        $video = new Video;
        $casts = $video->getCasts();

        $this->assertEquals('integer', $casts['size']);
        $this->assertEquals('integer', $casts['duration']);
        $this->assertEquals('integer', $casts['width']);
        $this->assertEquals('integer', $casts['height']);
        $this->assertEquals('array', $casts['metadata']);
    }

    public function test_should_use_videos_table(): void
    {
        $video = new Video;

        $this->assertEquals('videos', $video->getTable());
    }
}
