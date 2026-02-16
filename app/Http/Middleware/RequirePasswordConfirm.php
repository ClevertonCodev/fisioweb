<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\RequirePassword;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePasswordConfirm extends RequirePassword
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string|null  $redirectToRoute
     * @param  int|null  $passwordTimeoutSeconds
     */
    public function handle($request, \Closure $next, $redirectToRoute = null, $passwordTimeoutSeconds = null): Response
    {
        if ($redirectToRoute === null) {
            $redirectToRoute = $this->detectRedirectRoute($request);
        }

        return parent::handle($request, $next, $redirectToRoute, $passwordTimeoutSeconds);
    }

    protected function detectRedirectRoute(Request $request): string
    {
        if ($request->is('admin/*') || $request->is('admin/settings/*')) {
            return 'admin.password.confirm';
        }

        if ($request->is('clinic/*') || $request->is('clinic/settings/*')) {
            return 'clinic.password.confirm';
        }

        $referer = $request->header('referer');
        if ($referer && str_contains($referer, '/clinic/')) {
            return 'clinic.password.confirm';
        }

        if ($referer && str_contains($referer, '/admin/')) {
            return 'admin.password.confirm';
        }

        return 'clinic.password.confirm';
    }
}
