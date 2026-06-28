<?php

namespace Modules\Clinic\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\Clinic\Listeners\RecordSchedulingActivity;
use Modules\ClinicScheduling\Events\AppointmentCancelled;
use Modules\ClinicScheduling\Events\AppointmentCompleted;
use Modules\ClinicScheduling\Events\AppointmentScheduled;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event handler mappings for the application.
     *
     * @var array<string, array<int, string>>
     */
    protected $listen = [
        AppointmentScheduled::class => [[RecordSchedulingActivity::class, 'onScheduled']],
        AppointmentCompleted::class => [[RecordSchedulingActivity::class, 'onCompleted']],
        AppointmentCancelled::class => [[RecordSchedulingActivity::class, 'onCancelled']],
    ];

    /**
     * Indicates if events should be discovered.
     *
     * @var bool
     */
    protected static $shouldDiscoverEvents = true;

    /**
     * Configure the proper event listeners for email verification.
     */
    protected function configureEmailVerification(): void {}
}
