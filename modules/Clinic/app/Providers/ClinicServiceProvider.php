<?php

namespace Modules\Clinic\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Modules\Clinic\Auth\ActiveClinicUserProvider;
use Modules\Clinic\Contracts\ActivityLoggerInterface;
use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Contracts\ClinicServiceInterface;
use Modules\Clinic\Contracts\ClinicUserPreferenceRepositoryInterface;
use Modules\Clinic\Contracts\ClinicUserPreferenceServiceInterface;
use Modules\Clinic\Contracts\ClinicUserServiceInterface;
use Modules\Clinic\Contracts\DashboardRepositoryInterface;
use Modules\Clinic\Contracts\DashboardServiceInterface;
use Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface;
use Modules\Clinic\Contracts\Public\GoogleCalendarConnectionWriteServiceInterface;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Observers\ClinicObserver;
use Modules\Clinic\Policies\ClinicUserPolicy;
use Modules\Clinic\Policies\PatientPolicy;
use Modules\Clinic\Repositories\ClinicRepository;
use Modules\Clinic\Repositories\ClinicUserPreferenceRepository;
use Modules\Clinic\Repositories\DashboardRepository;
use Modules\Clinic\Services\ActivityLogger;
use Modules\Clinic\Services\ClinicService;
use Modules\Clinic\Services\ClinicUserPreferenceService;
use Modules\Clinic\Services\ClinicUserService;
use Modules\Clinic\Services\DashboardService;
use Modules\Clinic\Services\GoogleCalendarConnectionService;
use Modules\Patient\Models\Patient;
use Nwidart\Modules\Traits\PathNamespace;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ClinicServiceProvider extends ServiceProvider
{
    use PathNamespace;

    protected string $name = 'Clinic';

    protected string $nameLower = 'clinic';

    /**
     * Boot the application events.
     */
    public function boot(): void
    {
        $this->registerCommands();
        $this->registerCommandSchedules();
        $this->registerTranslations();
        $this->registerConfig();
        $this->registerViews();
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));
        Clinic::observe(ClinicObserver::class);

        $this->registerPolicies();
        $this->registerAuthProvider();
        $this->registerGateBefore();
        $this->registerAuthRateLimiters();
    }

    /**
     * Register the service provider.
     */
    public function register(): void
    {
        $this->app->bind(ClinicUserServiceInterface::class, ClinicUserService::class);
        $this->app->bind(ClinicRepositoryInterface::class, ClinicRepository::class);
        $this->app->bind(ClinicServiceInterface::class, ClinicService::class);
        $this->app->bind(DashboardRepositoryInterface::class, DashboardRepository::class);
        $this->app->bind(DashboardServiceInterface::class, DashboardService::class);
        $this->app->bind(ActivityLoggerInterface::class, ActivityLogger::class);
        $this->app->bind(ClinicUserPreferenceRepositoryInterface::class, ClinicUserPreferenceRepository::class);
        $this->app->bind(ClinicUserPreferenceServiceInterface::class, ClinicUserPreferenceService::class);
        $this->app->bind(ClinicUserGoogleConnectionReadServiceInterface::class, GoogleCalendarConnectionService::class);
        $this->app->bind(GoogleCalendarConnectionWriteServiceInterface::class, GoogleCalendarConnectionService::class);

        $this->app->register(EventServiceProvider::class);
        $this->app->register(RouteServiceProvider::class);
    }

    protected function registerPolicies(): void
    {
        Gate::policy(Patient::class, PatientPolicy::class);
        Gate::policy(ClinicUser::class, ClinicUserPolicy::class);
    }

    /**
     * Limites das rotas públicas de autenticação da clínica: login por e-mail
     * e IP (um e-mail travado não trava os outros), senha por rota e IP.
     */
    protected function registerAuthRateLimiters(): void
    {
        // Repassa Retry-After e X-RateLimit-* que o throttle monta.
        $tooMany = fn (Request $request, array $headers) => response()->json([
            'message' => 'Muitas tentativas. Aguarde um minuto e tente de novo.',
        ], 429, $headers);

        // O limitador roda antes da validação: e-mail que não é texto vira
        // chave vazia e segue para o 422 do FormRequest.
        RateLimiter::for('clinic-login', function (Request $request) use ($tooMany) {
            $email = $request->input('email');

            return Limit::perMinute(5)
                ->by((is_string($email) ? mb_strtolower($email) : '') . '|' . $request->ip())
                ->response($tooMany);
        });

        // Uma conta por rota: pedir links não gasta as tentativas de redefinir.
        RateLimiter::for('clinic-password', fn (Request $request) => Limit::perMinute(5)
            ->by($request->path() . '|' . $request->ip())
            ->response($tooMany));
    }

    /** Driver do provider `clinic_users` (config/auth.php): só usuário ativo autentica. */
    protected function registerAuthProvider(): void
    {
        Auth::provider('clinic_active_eloquent', fn ($app, array $config) => new ActiveClinicUserProvider(
            $app['hash'],
            $config['model'],
        ));
    }

    protected function registerGateBefore(): void
    {
        Gate::before(function ($user, $ability) {
            if ($user instanceof ClinicUser && $user->isAdmin() && (int) $user->status === ClinicUser::STATUS_ACTIVE) {
                return true;
            }
        });
    }

    /**
     * Register commands in the format of Command::class
     */
    protected function registerCommands(): void
    {
        // $this->commands([]);
    }

    /**
     * Register command Schedules.
     */
    protected function registerCommandSchedules(): void
    {
        // $this->app->booted(function () {
        //     $schedule = $this->app->make(Schedule::class);
        //     $schedule->command('inspire')->hourly();
        // });
    }

    /**
     * Register translations.
     */
    public function registerTranslations(): void
    {
        $langPath = resource_path('lang/modules/' . $this->nameLower);

        if (is_dir($langPath)) {
            $this->loadTranslationsFrom($langPath, $this->nameLower);
            $this->loadJsonTranslationsFrom($langPath);
        } else {
            $this->loadTranslationsFrom(module_path($this->name, 'lang'), $this->nameLower);
            $this->loadJsonTranslationsFrom(module_path($this->name, 'lang'));
        }
    }

    /**
     * Register config.
     */
    protected function registerConfig(): void
    {
        $configPath = module_path($this->name, config('modules.paths.generator.config.path'));

        if (is_dir($configPath)) {
            $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($configPath));

            foreach ($iterator as $file) {
                if ($file->isFile() && $file->getExtension() === 'php') {
                    $config     = str_replace($configPath . DIRECTORY_SEPARATOR, '', $file->getPathname());
                    $config_key = str_replace([DIRECTORY_SEPARATOR, '.php'], ['.', ''], $config);
                    $segments   = explode('.', $this->nameLower . '.' . $config_key);

                    // Remove duplicated adjacent segments
                    $normalized = [];
                    foreach ($segments as $segment) {
                        if (end($normalized) !== $segment) {
                            $normalized[] = $segment;
                        }
                    }

                    $key = ($config === 'config.php') ? $this->nameLower : implode('.', $normalized);

                    $this->publishes([$file->getPathname() => config_path($config)], 'config');
                    $this->merge_config_from($file->getPathname(), $key);
                }
            }
        }
    }

    /**
     * Merge config from the given path recursively.
     */
    protected function merge_config_from(string $path, string $key): void
    {
        $existing      = config($key, []);
        $module_config = require $path;

        config([$key => array_replace_recursive($existing, $module_config)]);
    }

    /**
     * Register views.
     */
    public function registerViews(): void
    {
        $viewPath   = resource_path('views/modules/' . $this->nameLower);
        $sourcePath = module_path($this->name, 'resources/views');

        $this->publishes([$sourcePath => $viewPath], ['views', $this->nameLower . '-module-views']);

        $this->loadViewsFrom(array_merge($this->getPublishableViewPaths(), [$sourcePath]), $this->nameLower);

        Blade::componentNamespace(config('modules.namespace') . '\\' . $this->name . '\\View\\Components', $this->nameLower);
    }

    /**
     * Get the services provided by the provider.
     */
    public function provides(): array
    {
        return [];
    }

    private function getPublishableViewPaths(): array
    {
        $paths = [];
        foreach (config('view.paths') as $path) {
            if (is_dir($path . '/modules/' . $this->nameLower)) {
                $paths[] = $path . '/modules/' . $this->nameLower;
            }
        }

        return $paths;
    }
}
