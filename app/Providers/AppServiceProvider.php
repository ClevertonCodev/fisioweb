<?php

namespace App\Providers;

use App\Auth\PasswordAwareJwtGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;
use Opcodes\LogViewer\Facades\LogViewer;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureLogViewer();
        $this->registerPasswordAwareJwtGuard();
    }

    protected function registerPasswordAwareJwtGuard(): void
    {
        Auth::extend('jwt_password_aware', function ($app, string $name, array $config) {
            $guard = new PasswordAwareJwtGuard(
                $app['tymon.jwt'],
                $app['auth']->createUserProvider($config['provider']),
                $app['request'],
                $app['events'],
            );

            $guard->setTTL(Arr::get($config, 'ttl', $app['config']->get('jwt.ttl')));

            $app->refresh('request', $guard, 'setRequest');

            return $guard;
        });
    }

    protected function configureLogViewer(): void
    {
        LogViewer::auth(function (Request $request): bool {
            if (!app()->isProduction()) {
                return true;
            }

            return !empty($request->server('REMOTE_USER'));
        });
    }
}
