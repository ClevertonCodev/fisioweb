<?php

namespace Modules\ClinicFinance\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Modules\ClinicFinance\Console\Commands\GenerateRecurringTransactionsCommand;
use Modules\ClinicFinance\Contracts\FinanceCalendarServiceInterface;
use Modules\ClinicFinance\Contracts\FinanceExportServiceInterface;
use Modules\ClinicFinance\Contracts\FinanceReportServiceInterface;
use Modules\ClinicFinance\Contracts\FinanceSummaryServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialAttachmentRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialAttachmentServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialCategoryRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialCategoryServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialRecurrenceServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialSeriesRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialSeriesServiceInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionRepositoryInterface;
use Modules\ClinicFinance\Contracts\FinancialTransactionServiceInterface;
use Modules\ClinicFinance\Contracts\PeriodOpeningBalanceRepositoryInterface;
use Modules\ClinicFinance\Contracts\TransactionPeopleServiceInterface;
use Modules\ClinicFinance\Models\FinancialAttachment;
use Modules\ClinicFinance\Models\FinancialCategory;
use Modules\ClinicFinance\Models\FinancialTransaction;
use Modules\ClinicFinance\Models\PeriodOpeningBalance;
use Modules\ClinicFinance\Policies\FinancialAttachmentPolicy;
use Modules\ClinicFinance\Policies\FinancialCategoryPolicy;
use Modules\ClinicFinance\Policies\FinancialTransactionPolicy;
use Modules\ClinicFinance\Policies\PeriodOpeningBalancePolicy;
use Modules\ClinicFinance\Repositories\FinancialAttachmentRepository;
use Modules\ClinicFinance\Repositories\FinancialCategoryRepository;
use Modules\ClinicFinance\Repositories\FinancialSeriesRepository;
use Modules\ClinicFinance\Repositories\FinancialTransactionRepository;
use Modules\ClinicFinance\Repositories\PeriodOpeningBalanceRepository;
use Modules\ClinicFinance\Services\FinanceCalendarService;
use Modules\ClinicFinance\Services\FinanceExportService;
use Modules\ClinicFinance\Services\FinanceReportService;
use Modules\ClinicFinance\Services\FinanceSummaryService;
use Modules\ClinicFinance\Services\FinancialAttachmentService;
use Modules\ClinicFinance\Services\FinancialCategoryService;
use Modules\ClinicFinance\Services\FinancialRecurrenceService;
use Modules\ClinicFinance\Services\FinancialSeriesService;
use Modules\ClinicFinance\Services\FinancialTransactionService;
use Modules\ClinicFinance\Services\TransactionPeopleService;
use Nwidart\Modules\Traits\PathNamespace;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

class ClinicFinanceServiceProvider extends ServiceProvider
{
    use PathNamespace;

    protected string $name = 'ClinicFinance';

    protected string $nameLower = 'clinicfinance';

    public function boot(): void
    {
        $this->registerConfig();
        $this->registerViews();
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));
        $this->registerPolicies();
        $this->registerCommands();
    }

    /** O comando diário que cria as próximas ocorrências das recorrências (tarefa 016). */
    protected function registerCommands(): void
    {
        $this->commands([GenerateRecurringTransactionsCommand::class]);

        $this->app->booted(function () {
            $this->app->make(Schedule::class)
                ->command(GenerateRecurringTransactionsCommand::class)
                ->dailyAt('03:00')
                ->withoutOverlapping()
                ->onOneServer();
        });
    }

    public function register(): void
    {
        $this->app->bind(FinancialTransactionRepositoryInterface::class, FinancialTransactionRepository::class);
        $this->app->bind(FinancialCategoryRepositoryInterface::class, FinancialCategoryRepository::class);
        $this->app->bind(PeriodOpeningBalanceRepositoryInterface::class, PeriodOpeningBalanceRepository::class);
        $this->app->bind(FinancialTransactionServiceInterface::class, FinancialTransactionService::class);
        $this->app->bind(FinancialCategoryServiceInterface::class, FinancialCategoryService::class);
        $this->app->bind(FinanceSummaryServiceInterface::class, FinanceSummaryService::class);
        $this->app->bind(FinanceCalendarServiceInterface::class, FinanceCalendarService::class);
        $this->app->bind(FinanceReportServiceInterface::class, FinanceReportService::class);
        $this->app->bind(FinanceExportServiceInterface::class, FinanceExportService::class);
        $this->app->bind(FinancialSeriesRepositoryInterface::class, FinancialSeriesRepository::class);
        $this->app->bind(FinancialSeriesServiceInterface::class, FinancialSeriesService::class);
        $this->app->bind(FinancialRecurrenceServiceInterface::class, FinancialRecurrenceService::class);
        $this->app->bind(TransactionPeopleServiceInterface::class, TransactionPeopleService::class);
        $this->app->bind(FinancialAttachmentRepositoryInterface::class, FinancialAttachmentRepository::class);
        $this->app->bind(FinancialAttachmentServiceInterface::class, FinancialAttachmentService::class);

        $this->app->register(EventServiceProvider::class);
        $this->app->register(RouteServiceProvider::class);
    }

    protected function registerPolicies(): void
    {
        Gate::policy(FinancialTransaction::class, FinancialTransactionPolicy::class);
        Gate::policy(FinancialCategory::class, FinancialCategoryPolicy::class);
        Gate::policy(PeriodOpeningBalance::class, PeriodOpeningBalancePolicy::class);
        Gate::policy(FinancialAttachment::class, FinancialAttachmentPolicy::class);
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

    public function registerViews(): void
    {
        $viewPath   = resource_path('views/modules/' . $this->nameLower);
        $sourcePath = module_path($this->name, 'resources/views');

        $this->publishes([$sourcePath => $viewPath], ['views', $this->nameLower . '-module-views']);
        $this->loadViewsFrom([$sourcePath], $this->nameLower);

        Blade::componentNamespace(config('modules.namespace') . '\\' . $this->name . '\\View\\Components', $this->nameLower);
    }
}
