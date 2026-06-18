<?php

namespace Modules\GoogleCalendar\Providers;

use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    protected string $name = 'GoogleCalendar';

    public function register(): void {}

    public function boot(): void
    {
        $this->map();
    }

    public function map(): void
    {
        Route::middleware('api')
            ->prefix('api')
            ->name('api.')
            ->group(function () {
                require module_path($this->name, '/routes/api.php');
            });
    }
}
