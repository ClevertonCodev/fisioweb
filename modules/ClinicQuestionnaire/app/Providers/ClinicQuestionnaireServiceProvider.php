<?php

namespace Modules\ClinicQuestionnaire\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireRepositoryInterface;
use Modules\ClinicQuestionnaire\Contracts\PatientQuestionnaireServiceInterface;
use Modules\ClinicQuestionnaire\Contracts\QuestionnaireTemplateRepositoryInterface;
use Modules\ClinicQuestionnaire\Contracts\QuestionnaireTemplateServiceInterface;
use Modules\ClinicQuestionnaire\Models\PatientQuestionnaire;
use Modules\ClinicQuestionnaire\Models\QuestionnaireTemplate;
use Modules\ClinicQuestionnaire\Policies\PatientQuestionnairePolicy;
use Modules\ClinicQuestionnaire\Policies\QuestionnaireTemplatePolicy;
use Modules\ClinicQuestionnaire\Repositories\PatientQuestionnaireRepository;
use Modules\ClinicQuestionnaire\Repositories\QuestionnaireTemplateRepository;
use Modules\ClinicQuestionnaire\Services\PatientQuestionnaireService;
use Modules\ClinicQuestionnaire\Services\QuestionnaireTemplateService;
use Nwidart\Modules\Traits\PathNamespace;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ClinicQuestionnaireServiceProvider extends ServiceProvider
{
    use PathNamespace;

    protected string $name = 'ClinicQuestionnaire';

    protected string $nameLower = 'clinicquestionnaire';

    public function boot(): void
    {
        $this->registerConfig();
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));
        $this->registerPolicies();
    }

    public function register(): void
    {
        $this->app->bind(QuestionnaireTemplateServiceInterface::class, QuestionnaireTemplateService::class);
        $this->app->bind(QuestionnaireTemplateRepositoryInterface::class, QuestionnaireTemplateRepository::class);
        $this->app->bind(PatientQuestionnaireServiceInterface::class, PatientQuestionnaireService::class);
        $this->app->bind(PatientQuestionnaireRepositoryInterface::class, PatientQuestionnaireRepository::class);

        $this->app->register(EventServiceProvider::class);
        $this->app->register(RouteServiceProvider::class);
    }

    protected function registerPolicies(): void
    {
        Gate::policy(QuestionnaireTemplate::class, QuestionnaireTemplatePolicy::class);
        Gate::policy(PatientQuestionnaire::class, PatientQuestionnairePolicy::class);
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
