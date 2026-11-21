<?php

namespace Modules\Email\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Modules\ClinicQuestionnaire\Events\QuestionnaireEmailRequested;
use Modules\ClinicScheduling\Events\AppointmentEmailRequested;
use Modules\ClinicScheduling\Events\AppointmentReminderDue;
use Modules\Email\Contracts\AppointmentEmailSenderInterface;
use Modules\Email\Contracts\AppointmentReminderRepositoryInterface;
use Modules\Email\Contracts\AppointmentReminderSenderInterface;
use Modules\Email\Contracts\QuestionnaireEmailSenderInterface;
use Modules\Email\Contracts\ReminderUnsubscribeServiceInterface;
use Modules\Email\Contracts\TreatmentPlanEmailSenderInterface;
use Modules\Email\Listeners\EmbedBrandLogo;
use Modules\Email\Listeners\SendAppointmentEmail;
use Modules\Email\Listeners\SendAppointmentReminder;
use Modules\Email\Listeners\SendQuestionnaireEmail;
use Modules\Email\Listeners\SendTreatmentPlanEmail;
use Modules\Email\Repositories\AppointmentReminderRepository;
use Modules\Email\Services\AppointmentEmailSender;
use Modules\Email\Services\AppointmentReminderSender;
use Modules\Email\Services\QuestionnaireEmailSender;
use Modules\Email\Services\ReminderUnsubscribeService;
use Modules\Email\Services\TreatmentPlanEmailSender;
use Modules\TreatmentProgram\Events\TreatmentPlanEmailRequested;

class EmailServiceProvider extends ServiceProvider
{
    protected string $name = 'Email';

    protected string $nameLower = 'email';

    public function boot(): void
    {
        $this->loadViewsFrom(module_path($this->name, 'resources/views'), $this->nameLower);
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));

        Event::listen(MessageSending::class, EmbedBrandLogo::class);
        Event::listen(TreatmentPlanEmailRequested::class, SendTreatmentPlanEmail::class);
        Event::listen(QuestionnaireEmailRequested::class, SendQuestionnaireEmail::class);
        Event::listen(AppointmentEmailRequested::class, SendAppointmentEmail::class);
        Event::listen(AppointmentReminderDue::class, SendAppointmentReminder::class);

        RateLimiter::for('reminder-unsubscribe', fn (Request $request) => Limit::perMinute(10)
            ->by('reminder-unsubscribe|' . (string) $request->ip())
            ->response(fn (Request $req, array $headers) => response()->json([
                'message' => 'Muitas tentativas. Aguarde um minuto e tente de novo.',
            ], 429, $headers)));

        RateLimiter::for('clinic-patient-email', function (Request $request) {
            $userId = $request->user('clinic')?->getAuthIdentifier();

            return Limit::perMinute(5)
                ->by('clinic-patient-email|' . (is_null($userId) ? (string) $request->ip() : (string) $userId))
                ->response(fn (Request $req, array $headers) => response()->json([
                    'message' => 'Muitas tentativas de envio. Aguarde um minuto e tente de novo.',
                ], 429, $headers));
        });
    }

    public function register(): void
    {
        $this->mergeConfigFrom(dirname(__DIR__, 2) . '/config/config.php', $this->nameLower);

        $this->app->bind(TreatmentPlanEmailSenderInterface::class, TreatmentPlanEmailSender::class);
        $this->app->bind(QuestionnaireEmailSenderInterface::class, QuestionnaireEmailSender::class);
        $this->app->bind(AppointmentEmailSenderInterface::class, AppointmentEmailSender::class);
        $this->app->bind(AppointmentReminderSenderInterface::class, AppointmentReminderSender::class);
        $this->app->bind(AppointmentReminderRepositoryInterface::class, AppointmentReminderRepository::class);
        $this->app->bind(ReminderUnsubscribeServiceInterface::class, ReminderUnsubscribeService::class);

        $this->app->register(RouteServiceProvider::class);

        $config = $this->app['config'];
        $config->set('mail.markdown.theme', 'ivsmed');
        $config->set('mail.markdown.paths', array_values(array_unique([
            dirname(__DIR__, 2) . '/resources/views/mail',
            ...(array) $config->get('mail.markdown.paths', []),
        ])));
    }
}
