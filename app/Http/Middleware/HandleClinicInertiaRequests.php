<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

/**
 * Middleware Inertia exclusivo da área da Clínica.
 */
class HandleClinicInertiaRequests extends Middleware
{
    protected $rootView = 'clinic';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $success = null;
        $error   = null;

        if ($request->session()->has('success')) {
            $request->session()->keep(['success']);
            $success = $request->session()->get('success');
        }

        if ($request->session()->has('error')) {
            $request->session()->keep(['error']);
            $error = $request->session()->get('error');
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user('clinic'),
            ],
            'flash' => [
                'success' => $success,
                'error'   => $error,
            ],
        ];
    }
}
