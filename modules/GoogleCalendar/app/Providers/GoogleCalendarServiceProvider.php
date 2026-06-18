<?php

namespace Modules\GoogleCalendar\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\ServiceProvider;
use Modules\GoogleCalendar\Console\Commands\PullGoogleCalendarCommand;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Services\GoogleCalendarService;

class GoogleCalendarServiceProvider extends ServiceProvider
{
    protected string $name = 'GoogleCalendar';

    protected string $nameLower = 'googlecalendar';

    public function boot(): void
    {
        $this->registerConfig();
        $this->registerCommands();
        $this->registerCommandSchedules();
    }

    public function register(): void
    {
        $this->app->bind(GoogleCalendarServiceInterface::class, GoogleCalendarService::class);
        $this->app->register(RouteServiceProvider::class);
    }

    protected function registerConfig(): void
    {
        $this->mergeConfigFrom(
            module_path($this->name, 'config/config.php'),
            $this->nameLower,
        );
    }

    protected function registerCommands(): void
    {
        $this->commands([
            PullGoogleCalendarCommand::class,
        ]);
    }

    protected function registerCommandSchedules(): void
    {
        $this->app->booted(function () {
            $schedule = $this->app->make(Schedule::class);
            $minutes  = (int) config('googlecalendar.pull_interval_minutes', 5);

            $schedule->command(PullGoogleCalendarCommand::class)
                ->cron("*/{$minutes} * * * *")
                ->withoutOverlapping();
        });
    }

    public function provides(): array
    {
        return [GoogleCalendarServiceInterface::class];
    }
}
