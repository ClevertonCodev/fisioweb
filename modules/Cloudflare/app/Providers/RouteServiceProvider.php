<?php

namespace Modules\Cloudflare\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    protected string $name = 'Cloudflare';

    public function register(): void {}

    public function boot(): void
    {
        $this->map();
    }

    /**
     * Define the routes for the application.
     */
    public function map(): void
    {
        // Cloudflare module has no routes (storage/R2 only).
    }
}
