<?php

namespace Modules\Cloudflare\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Cloudflare\Models\Video;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Modules\Cloudflare\Models\Cloudflare>
 */
class VideoFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Video::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
        ];
    }
}
