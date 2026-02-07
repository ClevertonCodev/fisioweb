<?php

namespace Modules\Cloudflare\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Cloudflare\Console\Commands\TestR2ConnectionCommand;
use Modules\Cloudflare\Console\Commands\TestUploadCommand;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Cloudflare\Contracts\ImageServiceInterface;
use Modules\Cloudflare\Contracts\VideoServiceInterface;
use Modules\Cloudflare\Services\CloudflareR2Service;
use Modules\Cloudflare\Services\PhotoService;
use Modules\Cloudflare\Services\VideoService;

class CloudflareServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(base_path('config/cloudflare.php'), 'cloudflare');

        $this->app->bind(FileServiceInterface::class, CloudflareR2Service::class);
        $this->app->bind(ImageServiceInterface::class, PhotoService::class);
        $this->app->bind(VideoServiceInterface::class, VideoService::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'cloudflare');

        if ($this->app->runningInConsole()) {
            $this->commands([
                TestR2ConnectionCommand::class,
                TestUploadCommand::class,
            ]);
        }
    }
}
