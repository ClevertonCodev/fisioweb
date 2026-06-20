<?php

namespace Modules\Xlsx\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Xlsx\Services\XlsxService;
use Nwidart\Modules\Traits\PathNamespace;

class XlsxServiceProvider extends ServiceProvider
{
    use PathNamespace;

    protected string $name = 'Xlsx';

    protected string $nameLower = 'xlsx';

    public function boot(): void
    {
        //
    }

    public function register(): void
    {
        $this->app->singleton(XlsxService::class);
    }
}
