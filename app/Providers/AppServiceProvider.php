<?php

namespace App\Providers;

use Illuminate\Http\Request;
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
        LogViewer::auth(function (Request $request): bool {
            if (!app()->isProduction()) {
                return true;
            }

            return !empty($request->server('REMOTE_USER'));
        });
    }
}
