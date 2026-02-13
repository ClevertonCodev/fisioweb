<?php

namespace Modules\Media\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Media\Contracts\ImageServiceInterface;
use Modules\Media\Contracts\VideoServiceInterface;
use Modules\Media\Services\PhotoService;
use Modules\Media\Services\VideoService;

class MediaServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(ImageServiceInterface::class, PhotoService::class);
        $this->app->bind(VideoServiceInterface::class, VideoService::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
    }
}
