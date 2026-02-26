<?php

namespace Modules\Patient\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Patient\Contracts\PatientRepositoryInterface;
use Modules\Patient\Contracts\PatientServiceInterface;
use Modules\Patient\Repositories\PatientRepository;
use Modules\Patient\Services\PatientService;

class PatientServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PatientRepositoryInterface::class, PatientRepository::class);
        $this->app->bind(PatientServiceInterface::class, PatientService::class);
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
    }
}
