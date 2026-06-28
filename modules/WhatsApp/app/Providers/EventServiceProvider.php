<?php

namespace Modules\WhatsApp\Providers;

use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Modules\ClinicQuestionnaire\Events\QuestionnaireSent;
use Modules\WhatsApp\Listeners\SendQuestionnaireWhatsAppListener;

class EventServiceProvider extends ServiceProvider
{
    /**
     * @var array<string, array<int, string>>
     */
    protected $listen = [
        QuestionnaireSent::class => [SendQuestionnaireWhatsAppListener::class],
    ];

    protected static $shouldDiscoverEvents = true;

    protected function configureEmailVerification(): void {}
}
