<?php

namespace Modules\Clinic\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Clinic\Contracts\TreatmentPlanRepositoryInterface;
use Modules\Clinic\Contracts\TreatmentPlanServiceInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Observers\ClinicObserver;
use Modules\Clinic\Repositories\TreatmentPlanRepository;
use Modules\Clinic\Services\TreatmentPlanService;

class ClinicServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(TreatmentPlanRepositoryInterface::class, TreatmentPlanRepository::class);
        $this->app->bind(TreatmentPlanServiceInterface::class, TreatmentPlanService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
        Clinic::observe(ClinicObserver::class);
    }
}
