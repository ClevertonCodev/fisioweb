<?php

namespace Modules\ClinicFinance\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\ClinicFinance\Policies\FinanceAccess;
use Symfony\Component\HttpFoundation\Response;

/** Porta do grupo /api/clinic/finances: administrador ou secretária. */
class EnsureFinanceAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!FinanceAccess::canUse($request->user('clinic'))) {
            return response()->json([
                'message' => 'Acesso restrito ao administrador e à secretária da clínica.',
            ], 403);
        }

        return $next($request);
    }
}
