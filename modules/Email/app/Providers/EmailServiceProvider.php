<?php

namespace Modules\Email\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Modules\Email\Contracts\TreatmentPlanEmailSenderInterface;
use Modules\Email\Listeners\EmbedBrandLogo;
use Modules\Email\Listeners\SendTreatmentPlanEmail;
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

        $config = $this->app['config'];
        $config->set('mail.markdown.theme', 'ivsmed');
        $config->set('mail.markdown.paths', array_values(array_unique([
            dirname(__DIR__, 2) . '/resources/views/mail',
            ...(array) $config->get('mail.markdown.paths', []),
        ])));
    }
}
