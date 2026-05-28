<?php

namespace Modules\Clinic\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class SetClinicGuardAsDefault
{
    public function handle(Request $request, Closure $next): Response
    {
        Auth::shouldUse('clinic');

        return $next($request);
    }
}
