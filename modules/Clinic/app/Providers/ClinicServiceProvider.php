<?php

namespace Modules\Clinic\Providers;

use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Modules\Clinic\Contracts\ActivityLoggerInterface;
use Modules\Clinic\Contracts\AppointmentRepositoryInterface;
use Modules\Clinic\Contracts\AppointmentServiceInterface;
use Modules\Clinic\Contracts\AssessmentServiceInterface;
use Modules\Clinic\Contracts\ClinicRepositoryInterface;
use Modules\Clinic\Contracts\ClinicServiceInterface;
use Modules\Clinic\Contracts\ClinicUserServiceInterface;
use Modules\Clinic\Contracts\DashboardRepositoryInterface;
use Modules\Clinic\Contracts\DashboardServiceInterface;
use Modules\Clinic\Contracts\EvolutionServiceInterface;
use Modules\Clinic\Contracts\EvolutionTemplateServiceInterface;
use Modules\Clinic\Contracts\FinancialCategoryRepositoryInterface;
use Modules\Clinic\Contracts\FinancialTransactionRepositoryInterface;
use Modules\Clinic\Contracts\PeriodOpeningBalanceRepositoryInterface;
use Modules\Clinic\Contracts\TreatmentPlanRepositoryInterface;
use Modules\Clinic\Contracts\TreatmentPlanServiceInterface;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\Assessment;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Clinic\Models\FinancialCategory;
use Modules\Clinic\Models\FinancialTransaction;
use Modules\Clinic\Models\PatientEvolution;
use Modules\Clinic\Models\PatientFile;
use Modules\Clinic\Models\PatientQuestionnaire;
use Modules\Clinic\Models\QuestionnaireTemplate;
use Modules\Clinic\Models\TreatmentPlan;
use Modules\Clinic\Observers\ClinicObserver;
use Modules\Clinic\Observers\TreatmentPlanObserver;
use Modules\Clinic\Policies\AppointmentPolicy;
use Modules\Clinic\Policies\AssessmentPolicy;
use Modules\Clinic\Policies\ClinicUserPolicy;
use Modules\Clinic\Policies\FinancialCategoryPolicy;
use Modules\Clinic\Policies\FinancialTransactionPolicy;
use Modules\Clinic\Policies\PatientEvolutionPolicy;
use Modules\Clinic\Policies\PatientFilePolicy;
use Modules\Clinic\Policies\PatientPolicy;
use Modules\Clinic\Policies\PatientQuestionnairePolicy;
use Modules\Clinic\Policies\QuestionnaireTemplatePolicy;
use Modules\Clinic\Policies\TreatmentPlanPolicy;
use Modules\Clinic\Repositories\AppointmentRepository;
use Modules\Clinic\Repositories\ClinicRepository;
use Modules\Clinic\Repositories\DashboardRepository;
use Modules\Clinic\Repositories\FinancialCategoryRepository;
use Modules\Clinic\Repositories\FinancialTransactionRepository;
use Modules\Clinic\Repositories\PeriodOpeningBalanceRepository;
use Modules\Clinic\Repositories\TreatmentPlanRepository;
use Modules\Clinic\Services\ActivityLogger;
use Modules\Clinic\Services\AppointmentService;
use Modules\Clinic\Services\AssessmentService;
use Modules\Clinic\Services\ClinicService;
use Modules\Clinic\Services\ClinicUserService;
use Modules\Clinic\Services\DashboardService;
use Modules\Clinic\Services\EvolutionService;
use Modules\Clinic\Services\EvolutionTemplateService;
use Modules\Clinic\Services\PatientFileService;
use Modules\Clinic\Services\PatientQuestionnaireService;
use Modules\Clinic\Services\TreatmentPlanService;
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
        TreatmentPlan::observe(TreatmentPlanObserver::class);

        $this->registerPolicies();
        $this->registerGateBefore();
    }

    /**
     * Register the service provider.
     */
    public function register(): void
    {
        $this->app->bind(ClinicUserServiceInterface::class, ClinicUserService::class);
        $this->app->bind(ClinicRepositoryInterface::class, ClinicRepository::class);
        $this->app->bind(ClinicServiceInterface::class, ClinicService::class);
        $this->app->bind(TreatmentPlanRepositoryInterface::class, TreatmentPlanRepository::class);
        $this->app->bind(TreatmentPlanServiceInterface::class, TreatmentPlanService::class);
        $this->app->bind(AppointmentRepositoryInterface::class, AppointmentRepository::class);
        $this->app->bind(AppointmentServiceInterface::class, AppointmentService::class);
        $this->app->bind(FinancialTransactionRepositoryInterface::class, FinancialTransactionRepository::class);
        $this->app->bind(FinancialCategoryRepositoryInterface::class, FinancialCategoryRepository::class);
        $this->app->bind(PeriodOpeningBalanceRepositoryInterface::class, PeriodOpeningBalanceRepository::class);
        $this->app->bind(DashboardRepositoryInterface::class, DashboardRepository::class);
        $this->app->bind(DashboardServiceInterface::class, DashboardService::class);
        $this->app->bind(ActivityLoggerInterface::class, ActivityLogger::class);
        $this->app->bind(AssessmentServiceInterface::class, AssessmentService::class);
        $this->app->bind(EvolutionServiceInterface::class, EvolutionService::class);
        $this->app->bind(EvolutionTemplateServiceInterface::class, EvolutionTemplateService::class);
        $this->app->singleton(PatientFileService::class);
        $this->app->singleton(PatientQuestionnaireService::class);

        $this->app->register(EventServiceProvider::class);
        $this->app->register(RouteServiceProvider::class);
    }

    protected function registerPolicies(): void
    {
        Gate::policy(Patient::class, PatientPolicy::class);
        Gate::policy(TreatmentPlan::class, TreatmentPlanPolicy::class);
        Gate::policy(Assessment::class, AssessmentPolicy::class);
        Gate::policy(PatientEvolution::class, PatientEvolutionPolicy::class);
        Gate::policy(EvolutionTemplate::class, EvolutionTemplatePolicy::class);
        Gate::policy(QuestionnaireTemplate::class, QuestionnaireTemplatePolicy::class);
        Gate::policy(PatientQuestionnaire::class, PatientQuestionnairePolicy::class);
        Gate::policy(PatientFile::class, PatientFilePolicy::class);
        Gate::policy(ClinicUser::class, ClinicUserPolicy::class);
        Gate::policy(FinancialTransaction::class, FinancialTransactionPolicy::class);
        Gate::policy(FinancialCategory::class, FinancialCategoryPolicy::class);
        Gate::policy(Appointment::class, AppointmentPolicy::class);
    }

    protected function registerGateBefore(): void
    {
        Gate::before(function ($user, $ability) {
            if ($user instanceof ClinicUser && $user->isAdmin()) {
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
