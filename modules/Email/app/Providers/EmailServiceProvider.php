<?php

namespace Modules\Email\Providers;

use Illuminate\Mail\Events\MessageSending;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Modules\Email\Listeners\EmbedBrandLogo;

class EmailServiceProvider extends ServiceProvider
{
    protected string $name = 'Email';

    protected string $nameLower = 'email';

    public function boot(): void
    {
        $this->loadViewsFrom(module_path($this->name, 'resources/views'), $this->nameLower);
        $this->loadMigrationsFrom(module_path($this->name, 'database/migrations'));

        Event::listen(MessageSending::class, EmbedBrandLogo::class);
    }

    public function register(): void
    {
        $this->mergeConfigFrom(dirname(__DIR__, 2) . '/config/config.php', $this->nameLower);

        $config = $this->app['config'];
        $config->set('mail.markdown.theme', 'ivsmed');
        $config->set('mail.markdown.paths', array_values(array_unique([
            dirname(__DIR__, 2) . '/resources/views/mail',
            ...(array) $config->get('mail.markdown.paths', []),
        ])));
    }
}
