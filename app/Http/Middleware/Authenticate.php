<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

/**
 * Middleware de autenticação customizado.
 *
 * Este middleware é usado AUTOMATICAMENTE pelo Laravel quando você usa:
 * - middleware('auth')
 * - middleware('auth:web')
 * - middleware('auth:clinic')
 *
 * O método redirectTo() é chamado quando o usuário NÃO está autenticado
 * e precisa ser redirecionado para a página de login correta.
 */
class Authenticate extends Middleware
{
    /**
     * Get the path the user should be redirected to when they are not authenticated.
     *
     * Este método é chamado automaticamente quando:
     * - Uma rota protegida com 'auth' ou 'auth:guard' é acessada
     * - O usuário NÃO está autenticado
     */
    protected function redirectTo(Request $request): ?string
    {
        if ($request->is('admin/*') || $request->is('admin/settings/*')) {
            return route('admin.login');
        }

        if ($request->is('clinic/*') || $request->is('clinic/settings/*')) {
            return route('clinic.login');
        }
        if ($request->is('settings/*')) {
            if (auth()->guard('clinic')->check()) {
                return route('clinic.login');
            }

            if (auth()->guard('web')->check()) {
                return route('admin.login');
            }

            $referer = $request->header('referer');
            if ($referer && str_contains($referer, '/clinic/')) {
                return route('clinic.login');
            }

            if ($referer && str_contains($referer, '/admin/')) {
                return route('admin.login');
            }

            return route('clinic.login');
        }

        return route('clinic.login');
    }
}
