<?php

namespace Modules\ClinicScheduling\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Modules\ClinicScheduling\Contracts\AppointmentRepositoryInterface;
use Modules\ClinicScheduling\Contracts\AppointmentServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentCancelFromExternalSourceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentSyncWriteServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentUpsertFromExternalSourceInterface;
use Modules\ClinicScheduling\Contracts\Public\SchedulingReadServiceInterface;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\ClinicScheduling\Policies\AppointmentPolicy;
use Modules\ClinicScheduling\Repositories\AppointmentRepository;
use Modules\ClinicScheduling\Services\AppointmentExternalSyncService;
use Modules\ClinicScheduling\Services\AppointmentService;
use Modules\ClinicScheduling\Services\SchedulingReadService;
use Nwidart\Modules\Traits\PathNamespace;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ClinicSchedulingServiceProvider extends ServiceProvider
{
    use PathNamespace;

    protected string $name = 'ClinicScheduling';

    protected string $nameLower = 'clinicscheduling';

    public function boot(): void
    {
        $this->registerConfig();
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));
        $this->registerPolicies();
    }

    public function register(): void
    {
        $this->app->bind(AppointmentRepositoryInterface::class, AppointmentRepository::class);
        $this->app->bind(AppointmentServiceInterface::class, AppointmentService::class);
        $this->app->bind(SchedulingReadServiceInterface::class, SchedulingReadService::class);
        $this->app->bind(AppointmentReadServiceInterface::class, AppointmentExternalSyncService::class);
        $this->app->bind(AppointmentSyncWriteServiceInterface::class, AppointmentExternalSyncService::class);
        $this->app->bind(AppointmentUpsertFromExternalSourceInterface::class, AppointmentExternalSyncService::class);
        $this->app->bind(AppointmentCancelFromExternalSourceInterface::class, AppointmentExternalSyncService::class);

        $this->app->register(EventServiceProvider::class);
        $this->app->register(RouteServiceProvider::class);
    }

    protected function registerPolicies(): void
    {
        Gate::policy(Appointment::class, AppointmentPolicy::class);
    }

    protected function registerConfig(): void
    {
        $configPath = module_path($this->name, config('modules.paths.generator.config.path'));

        if (!is_dir($configPath)) {
            return;
        }

        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($configPath));

        foreach ($iterator as $file) {
            if (!$file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }

            $config    = str_replace($configPath . DIRECTORY_SEPARATOR, '', $file->getPathname());
            $configKey = str_replace([DIRECTORY_SEPARATOR, '.php'], ['.', ''], $config);
            $key       = ($config === 'config.php') ? $this->nameLower : $this->nameLower . '.' . $configKey;

            $this->publishes([$file->getPathname() => config_path($config)], 'config');
            $this->mergeConfigFrom($file->getPathname(), $key);
        }
    }
}
