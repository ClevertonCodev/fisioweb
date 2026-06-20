<?php

namespace Modules\Clinic\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Modules\Clinic\Models\ClinicUser;
use Symfony\Component\HttpFoundation\Response;

class EnsureClinicAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('clinic');

        if (!$user instanceof ClinicUser || !$user->isAdmin()) {
            return response()->json([
                'message' => 'Acesso restrito ao administrador da clínica.',
            ], 403);
        }

        return $next($request);
    }
}
