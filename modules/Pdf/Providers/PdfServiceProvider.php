<?php

namespace Modules\Pdf\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Pdf\Services\PdfService;

class PdfServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(PdfService::class);
    }

    public function boot(): void
    {
        //
    }
}
