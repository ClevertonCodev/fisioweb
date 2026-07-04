<?php

namespace Modules\TreatmentProgram\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\TreatmentProgram\Events\TreatmentPlanActivated;
use Modules\TreatmentProgram\Listeners\SendTreatmentPlanActivationNotification;

class EventServiceProvider extends ServiceProvider
{
    /**
     * @var array<string, array<int, string>>
     */
    protected $listen = [
        TreatmentPlanActivated::class => [
            SendTreatmentPlanActivationNotification::class,
        ],
    ];

    protected static $shouldDiscoverEvents = false;
}
