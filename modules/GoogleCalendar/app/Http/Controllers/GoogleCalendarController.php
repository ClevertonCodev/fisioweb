<?php

namespace Modules\GoogleCalendar\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Modules\Clinic\Models\ClinicUser;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;

class GoogleCalendarController extends Controller
{
    public function __construct(
        protected GoogleCalendarServiceInterface $service,
    ) {}

    /** Inicia o fluxo OAuth — devolve a URL de consentimento. */
    public function connect(): JsonResponse
    {
        $user  = Auth::guard('clinic')->user();
        $state = Crypt::encryptString((string) $user->id);

        return response()->json([
            'data' => ['authorization_url' => $this->service->getAuthUrl($state)],
        ]);
    }

    /**
     * Callback do Google (redirect de navegador, sem JWT). O usuário é
     * correlacionado pelo `state` cifrado.
     */
    public function callback(Request $request): RedirectResponse
    {
        $redirect = (string) config('googlecalendar.frontend_redirect', '/clinic/usuarios');

        if ($request->filled('error') || !$request->filled('code') || !$request->filled('state')) {
            return redirect()->to($redirect . '?google=error');
        }

        try {
            $userId = (int) Crypt::decryptString($request->input('state'));
            $user   = ClinicUser::findOrFail($userId);

            $this->service->connectFromCallback($user, $request->input('code'));
        } catch (\Throwable $e) {
            Log::warning('Google Calendar callback falhou', ['message' => $e->getMessage()]);

            return redirect()->to($redirect . '?google=error');
        }

        return redirect()->to($redirect . '?google=connected');
    }

    /** Desconecta a conta Google do usuário autenticado. */
    public function disconnect(): JsonResponse
    {
        $user = Auth::guard('clinic')->user();
        $this->service->disconnect($user);

        return response()->json(['data' => ['connected' => false]]);
    }

    /** Estado de conexão do usuário autenticado. */
    public function status(): JsonResponse
    {
        $user = Auth::guard('clinic')->user();

        return response()->json([
            'data' => [
                'connected'          => $user->isGoogleConnected(),
                'google_calendar_id' => $user->google_calendar_id,
                'connected_at'       => $user->google_connected_at,
            ],
        ]);
    }
}
