<?php

namespace Modules\GoogleCalendar\Providers;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Modules\ClinicScheduling\Events\AppointmentCancelled;
use Modules\ClinicScheduling\Events\AppointmentRescheduled;
use Modules\ClinicScheduling\Events\AppointmentScheduled;
use Modules\GoogleCalendar\Console\Commands\PullGoogleCalendarCommand;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Listeners\SyncSchedulingToGoogle;
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
        $this->registerSchedulingListeners();
    }

    /** Listeners de integração reagindo aos eventos de ClinicScheduling (EDA). */
    protected function registerSchedulingListeners(): void
    {
        Event::listen(AppointmentScheduled::class, [SyncSchedulingToGoogle::class, 'onUpsert']);
        Event::listen(AppointmentRescheduled::class, [SyncSchedulingToGoogle::class, 'onUpsert']);
        Event::listen(AppointmentCancelled::class, [SyncSchedulingToGoogle::class, 'onCancelled']);
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
