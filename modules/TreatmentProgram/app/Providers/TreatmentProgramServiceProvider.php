<?php

namespace Modules\TreatmentProgram\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Modules\TreatmentProgram\Contracts\CompletePatientProgramServiceInterface;
use Modules\TreatmentProgram\Contracts\GetPatientProgramDetailServiceInterface;
use Modules\TreatmentProgram\Contracts\ListPatientProgramsServiceInterface;
use Modules\TreatmentProgram\Contracts\PatientProgramRepositoryInterface;
use Modules\TreatmentProgram\Contracts\ProgramDraftRepositoryInterface;
use Modules\TreatmentProgram\Contracts\ProgramDraftServiceInterface;
use Modules\TreatmentProgram\Contracts\Public\TreatmentProgramReadServiceInterface;
use Modules\TreatmentProgram\Contracts\RegisterPatientProgramViewServiceInterface;
use Modules\TreatmentProgram\Contracts\SavePatientProgramSeriesServiceInterface;
use Modules\TreatmentProgram\Contracts\StartOrResumePatientProgramExecutionServiceInterface;
use Modules\TreatmentProgram\Contracts\SubmitPatientProgramFeedbackServiceInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanExecutionRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanFeedbackRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanRepositoryInterface;
use Modules\TreatmentProgram\Contracts\TreatmentPlanServiceInterface;
use Modules\TreatmentProgram\Contracts\UpdateUnfinishedExercisesServiceInterface;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Policies\TreatmentPlanPolicy;
use Modules\TreatmentProgram\Repositories\EloquentPatientProgramRepository;
use Modules\TreatmentProgram\Repositories\EloquentTreatmentPlanExecutionRepository;
use Modules\TreatmentProgram\Repositories\EloquentTreatmentPlanFeedbackRepository;
use Modules\TreatmentProgram\Repositories\ProgramDraftRepository;
use Modules\TreatmentProgram\Repositories\TreatmentPlanRepository;
use Modules\TreatmentProgram\Repositories\TreatmentProgramReadService;
use Modules\TreatmentProgram\Services\PatientProgram\CompletePatientProgramService;
use Modules\TreatmentProgram\Services\PatientProgram\GetPatientProgramDetailService;
use Modules\TreatmentProgram\Services\PatientProgram\ListPatientProgramsService;
use Modules\TreatmentProgram\Services\PatientProgram\RegisterPatientProgramViewService;
use Modules\TreatmentProgram\Services\PatientProgram\SavePatientProgramSeriesService;
use Modules\TreatmentProgram\Services\PatientProgram\StartOrResumePatientProgramExecutionService;
use Modules\TreatmentProgram\Services\PatientProgram\SubmitPatientProgramFeedbackService;
use Modules\TreatmentProgram\Services\PatientProgram\UpdateUnfinishedExercisesService;
use Modules\TreatmentProgram\Services\ProgramDraftService;
use Modules\TreatmentProgram\Services\TreatmentPlanService;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class TreatmentProgramServiceProvider extends ServiceProvider
{
    protected string $name = 'TreatmentProgram';

    protected string $nameLower = 'treatmentprogram';

    public function boot(): void
    {
        $this->registerConfig();
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));
        $this->registerPolicies();
    }

    public function register(): void
    {
        $this->app->bind(TreatmentPlanRepositoryInterface::class, TreatmentPlanRepository::class);
        $this->app->bind(TreatmentPlanServiceInterface::class, TreatmentPlanService::class);
        $this->app->bind(ProgramDraftRepositoryInterface::class, ProgramDraftRepository::class);
        $this->app->bind(ProgramDraftServiceInterface::class, ProgramDraftService::class);
        $this->app->bind(TreatmentProgramReadServiceInterface::class, TreatmentProgramReadService::class);
        $this->app->bind(PatientProgramRepositoryInterface::class, EloquentPatientProgramRepository::class);
        $this->app->bind(TreatmentPlanExecutionRepositoryInterface::class, EloquentTreatmentPlanExecutionRepository::class);
        $this->app->bind(TreatmentPlanFeedbackRepositoryInterface::class, EloquentTreatmentPlanFeedbackRepository::class);
        $this->app->bind(ListPatientProgramsServiceInterface::class, ListPatientProgramsService::class);
        $this->app->bind(GetPatientProgramDetailServiceInterface::class, GetPatientProgramDetailService::class);
        $this->app->bind(RegisterPatientProgramViewServiceInterface::class, RegisterPatientProgramViewService::class);
        $this->app->bind(StartOrResumePatientProgramExecutionServiceInterface::class, StartOrResumePatientProgramExecutionService::class);
        $this->app->bind(SavePatientProgramSeriesServiceInterface::class, SavePatientProgramSeriesService::class);
        $this->app->bind(UpdateUnfinishedExercisesServiceInterface::class, UpdateUnfinishedExercisesService::class);
        $this->app->bind(SubmitPatientProgramFeedbackServiceInterface::class, SubmitPatientProgramFeedbackService::class);
        $this->app->bind(CompletePatientProgramServiceInterface::class, CompletePatientProgramService::class);

        $this->app->register(EventServiceProvider::class);
        $this->app->register(RouteServiceProvider::class);
    }

    protected function registerPolicies(): void
    {
        Gate::policy(TreatmentPlan::class, TreatmentPlanPolicy::class);
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
