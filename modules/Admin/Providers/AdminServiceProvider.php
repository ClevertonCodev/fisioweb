<?php

namespace Modules\Admin\Providers;

use Illuminate\Support\ServiceProvider;
use Modules\Admin\Contracts\ExerciseRepositoryInterface;
use Modules\Admin\Contracts\ExerciseServiceInterface;
use Modules\Admin\Repositories\ExerciseRepository;
use Modules\Admin\Services\ExerciseService;

class AdminServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(ExerciseRepositoryInterface::class, ExerciseRepository::class);
        $this->app->bind(ExerciseServiceInterface::class, ExerciseService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__ . '/../Database/Migrations');
        $this->loadRoutesFrom(__DIR__ . '/../routes/web.php');
    }
}
