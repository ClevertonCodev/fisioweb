<?php

namespace Modules\Patient\Providers;

use Illuminate\Support\ServiceProvider;

class PatientServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
    }
}
