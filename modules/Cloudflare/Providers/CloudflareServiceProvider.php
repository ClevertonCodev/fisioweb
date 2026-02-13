<?php

namespace Modules\Cloudflare\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Cloudflare\Console\Commands\TestR2ConnectionCommand;
use Modules\Cloudflare\Console\Commands\TestUploadCommand;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Cloudflare\Services\CloudflareR2Service;

class CloudflareServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(base_path('config/cloudflare.php'), 'cloudflare');

        $this->app->bind(FileServiceInterface::class, CloudflareR2Service::class);
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->commands([
                TestR2ConnectionCommand::class,
                TestUploadCommand::class,
            ]);
        }
    }
}
