<?php

namespace Modules\Cloudflare\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Cloudflare\Repositories\VideoRepository;
use Modules\Cloudflare\Services\CloudflareR2Service;

class CloudflareServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $configPath = base_path('config/cloudflare.php');
        if (file_exists($configPath)) {
            $this->mergeConfigFrom($configPath, 'cloudflare');
        }

        $this->app->singleton(VideoRepository::class, function ($app) {
            return new VideoRepository(new \Modules\Cloudflare\Models\Video());
        });

        $this->app->singleton(CloudflareR2Service::class, function ($app) {
            return new CloudflareR2Service(
                $app->make(VideoRepository::class)
            );
        });

        $this->app->bind(
            \Modules\Cloudflare\Contracts\VideoServiceInterface::class,
            CloudflareR2Service::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'cloudflare');
    }
}
