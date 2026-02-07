<?php

namespace Modules\Cloudflare\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Modules\Cloudflare\Models\Video;

/**
 * @extends Factory<Video>
 */
class VideoFactory extends Factory
{
    protected $model = Video::class;

    public function definition(): array
    {
        $filename = Str::uuid().'_'.now()->timestamp.'.mp4';

        return [
            'filename' => $filename,
            'original_filename' => fake()->words(3, true).'.mp4',
            'path' => 'videos/'.$filename,
            'url' => 'https://r2.example.com/videos/'.$filename,
            'cdn_url' => 'https://cdn.example.com/videos/'.$filename,
            'mime_type' => 'video/mp4',
            'size' => fake()->numberBetween(1048576, 524288000),
            'duration' => fake()->numberBetween(10, 3600),
            'width' => fake()->randomElement([1280, 1920, 3840]),
            'height' => fake()->randomElement([720, 1080, 2160]),
            'status' => Video::STATUS_COMPLETED,
            'metadata' => [],
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => Video::STATUS_PENDING]);
    }

    public function processing(): static
    {
        return $this->state(['status' => Video::STATUS_PROCESSING]);
    }

    public function failed(): static
    {
        return $this->state(['status' => Video::STATUS_FAILED]);
    }
}
