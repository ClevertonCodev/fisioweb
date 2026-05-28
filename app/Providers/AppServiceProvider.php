<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Opcodes\LogViewer\Facades\LogViewer;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureLogViewer();
    }

    protected function configureLogViewer(): void
    {
        LogViewer::auth(function ($request) {
            return !app()->isProduction();
        });
    }
}
