<?php

namespace Modules\ClinicalRecord\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Modules\ClinicalRecord\Contracts\AssessmentRepositoryInterface;
use Modules\ClinicalRecord\Contracts\AssessmentServiceInterface;
use Modules\ClinicalRecord\Contracts\EvolutionRepositoryInterface;
use Modules\ClinicalRecord\Contracts\EvolutionServiceInterface;
use Modules\ClinicalRecord\Contracts\EvolutionTemplateRepositoryInterface;
use Modules\ClinicalRecord\Contracts\EvolutionTemplateServiceInterface;
use Modules\ClinicalRecord\Contracts\PatientFileRepositoryInterface;
use Modules\ClinicalRecord\Contracts\PatientFileServiceInterface;
use Modules\ClinicalRecord\Models\Assessment;
use Modules\ClinicalRecord\Models\EvolutionTemplate;
use Modules\ClinicalRecord\Models\PatientEvolution;
use Modules\ClinicalRecord\Models\PatientFile;
use Modules\ClinicalRecord\Policies\AssessmentPolicy;
use Modules\ClinicalRecord\Policies\EvolutionTemplatePolicy;
use Modules\ClinicalRecord\Policies\PatientEvolutionPolicy;
use Modules\ClinicalRecord\Policies\PatientFilePolicy;
use Modules\ClinicalRecord\Repositories\AssessmentRepository;
use Modules\ClinicalRecord\Repositories\EvolutionRepository;
use Modules\ClinicalRecord\Repositories\EvolutionTemplateRepository;
use Modules\ClinicalRecord\Repositories\PatientFileRepository;
use Modules\ClinicalRecord\Services\AssessmentService;
use Modules\ClinicalRecord\Services\EvolutionService;
use Modules\ClinicalRecord\Services\EvolutionTemplateService;
use Modules\ClinicalRecord\Services\PatientFileService;
use Nwidart\Modules\Traits\PathNamespace;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ClinicalRecordServiceProvider extends ServiceProvider
{
    use PathNamespace;

    protected string $name = 'ClinicalRecord';

    protected string $nameLower = 'clinicalrecord';

    public function boot(): void
    {
        $this->registerConfig();
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));
        $this->registerPolicies();
    }

    public function register(): void
    {
        $this->app->bind(AssessmentServiceInterface::class, AssessmentService::class);
        $this->app->bind(AssessmentRepositoryInterface::class, AssessmentRepository::class);
        $this->app->bind(EvolutionServiceInterface::class, EvolutionService::class);
        $this->app->bind(EvolutionRepositoryInterface::class, EvolutionRepository::class);
        $this->app->bind(EvolutionTemplateServiceInterface::class, EvolutionTemplateService::class);
        $this->app->bind(EvolutionTemplateRepositoryInterface::class, EvolutionTemplateRepository::class);
        $this->app->bind(PatientFileServiceInterface::class, PatientFileService::class);
        $this->app->bind(PatientFileRepositoryInterface::class, PatientFileRepository::class);

        $this->app->register(EventServiceProvider::class);
        $this->app->register(RouteServiceProvider::class);
    }

    protected function registerPolicies(): void
    {
        Gate::policy(Assessment::class, AssessmentPolicy::class);
        Gate::policy(PatientEvolution::class, PatientEvolutionPolicy::class);
        Gate::policy(EvolutionTemplate::class, EvolutionTemplatePolicy::class);
        Gate::policy(PatientFile::class, PatientFilePolicy::class);
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
