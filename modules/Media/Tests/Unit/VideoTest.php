<?php

namespace Modules\Media\Tests\Unit;

use Modules\Media\Models\Video;
use PHPUnit\Framework\TestCase;

class VideoTest extends TestCase
{
    public function testShouldReturnZeroForHumanSizeWhenSizeIsNull(): void
    {
        $video = new Video();
        $video->size = null;

        $this->assertEquals('0 B', $video->human_size);
    }

    public function testShouldReturnZeroForHumanSizeWhenSizeIsZero(): void
    {
        $video = new Video();
        $video->size = 0;

        $this->assertEquals('0 B', $video->human_size);
    }

    public function testShouldReturnBytesForHumanSize(): void
    {
        $video = new Video();
        $video->size = 500;

        $this->assertEquals('500 B', $video->human_size);
    }

    public function testShouldReturnKilobytesForHumanSize(): void
    {
        $video = new Video();
        $video->size = 1024;

        $this->assertEquals('1 KB', $video->human_size);
    }

    public function testShouldReturnMegabytesForHumanSize(): void
    {
        $video = new Video();
        $video->size = 1048576;

        $this->assertEquals('1 MB', $video->human_size);
    }

    public function testShouldReturnGigabytesForHumanSize(): void
    {
        $video = new Video();
        $video->size = 1073741824;

        $this->assertEquals('1 GB', $video->human_size);
    }

    public function testShouldReturnDecimalValuesForHumanSize(): void
    {
        $video = new Video();
        $video->size = 1536000; // ~1.46 MB

        $this->assertEquals('1.46 MB', $video->human_size);
    }

    public function testShouldReturnNullForHumanDurationWhenDurationIsNull(): void
    {
        $video = new Video();
        $video->duration = null;

        $this->assertNull($video->human_duration);
    }

    public function testShouldReturnNullForHumanDurationWhenDurationIsZero(): void
    {
        $video = new Video();
        $video->duration = 0;

        $this->assertNull($video->human_duration);
    }

    public function testShouldFormatSecondsOnlyForHumanDuration(): void
    {
        $video = new Video();
        $video->duration = 45;

        $this->assertEquals('00:45', $video->human_duration);
    }

    public function testShouldFormatMinutesAndSecondsForHumanDuration(): void
    {
        $video = new Video();
        $video->duration = 125; // 2min 5sec

        $this->assertEquals('02:05', $video->human_duration);
    }

    public function testShouldFormatLargeDurationsForHumanDuration(): void
    {
        $video = new Video();
        $video->duration = 3661; // 61min 1sec

        $this->assertEquals('61:01', $video->human_duration);
    }

    public function testShouldContainExpectedFillableFields(): void
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

    public function testShouldHaveCastsConfiguredCorrectly(): void
    {
        $video = new Video();
        $casts = $video->getCasts();

        $this->assertEquals('integer', $casts['size']);
        $this->assertEquals('integer', $casts['duration']);
        $this->assertEquals('integer', $casts['width']);
        $this->assertEquals('integer', $casts['height']);
        $this->assertEquals('array', $casts['metadata']);
    }

    public function testShouldUseVideosTable(): void
    {
        $video = new Video();

        $this->assertEquals('videos', $video->getTable());
    }
}
