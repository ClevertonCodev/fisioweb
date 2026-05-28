<?php

namespace Modules\WhatsApp\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    protected string $name = 'WhatsApp';

    public function register(): void {}

    public function boot(): void
    {
        $this->map();
    }

    public function map(): void
    {
        // WhatsApp module has no routes (infra service only).
    }
}
