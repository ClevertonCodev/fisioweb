<?php

namespace App\Providers;

use App\Http\Middleware\HandleClinicInertiaRequests;
use App\Http\Middleware\HandlePatientInertiaRequests;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Opcodes\LogViewer\Facades\LogViewer;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->registerRouteAdminMacro();
        $this->registerRouteClinicMacro();
        $this->registerRoutePatientMacro();
        $this->configureDefaults();
        $this->configureLogViewer();
    }

    protected function registerRouteAdminMacro(): void
    {
        Route::macro('admin', function (callable $callback, bool $protected = true): void {
            Route::middleware('web')->group(function () use ($callback, $protected): void {
                $route = Route::prefix('admin')->name('admin.');
                if ($protected) {
                    $route->middleware(['auth:web']);
                }
                $route->group($callback);
            });
        });
    }

    protected function registerRouteClinicMacro(): void
    {
        Route::macro('clinic', function (callable $callback, bool $protected = true): void {
            Route::middleware(['web', HandleClinicInertiaRequests::class])->group(function () use ($callback, $protected): void {
                $route = Route::prefix('clinic')->name('clinic.');
                if ($protected) {
                    $route->middleware(['auth:clinic']);
                }
                $route->group($callback);
            });
        });
    }

    protected function registerRoutePatientMacro(): void
    {
        Route::macro('patient', function (callable $callback, bool $protected = true): void {
            Route::middleware(['web', HandlePatientInertiaRequests::class])->group(function () use ($callback, $protected): void {
                $route = Route::prefix('patient')->name('patient.');
                if ($protected) {
                    $route->middleware(['auth:patient']);
                }
                $route->group($callback);
            });
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }

    protected function configureLogViewer(): void
    {
        LogViewer::auth(function ($request) {
            if ($request->user() || !app()->isProduction()) {
                return true;
            }

            return false;
        });
    }
}
