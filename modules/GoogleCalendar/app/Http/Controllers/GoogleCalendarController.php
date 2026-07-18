<?php

namespace Modules\GoogleCalendar\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Jobs\PullGoogleCalendarJob;

class GoogleCalendarController extends Controller
{
    /** Paths SPA permitidos no retorno do OAuth (evita open redirect). */
    private const ALLOWED_RETURN_PATHS = [
        '/clinica/agenda',
        '/clinica/usuarios',
        '/clinic/usuarios',
    ];

    public function __construct(
        protected GoogleCalendarServiceInterface $service,
        protected ClinicUserGoogleConnectionReadServiceInterface $connections,
    ) {}

    /** Inicia o fluxo OAuth — devolve a URL de consentimento. */
    public function connect(Request $request): JsonResponse
    {
        $user     = Auth::guard('clinic')->user();
        $returnTo = $this->resolveReturnPath($request->query('return_to'));
        $state    = Crypt::encryptString(json_encode([
            'uid'    => (int) $user->id,
            'return' => $returnTo,
        ], JSON_THROW_ON_ERROR));

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
        $defaultRedirect = (string) config('googlecalendar.frontend_redirect', '/clinica/usuarios');
        $redirect        = $defaultRedirect;

        if ($request->filled('error') || !$request->filled('code') || !$request->filled('state')) {
            return redirect()->to($redirect . '?google=error');
        }

        try {
            [$userId, $redirect] = $this->parseOAuthState(
                (string) $request->input('state'),
                $defaultRedirect,
            );

            $this->service->connectFromCallback($userId, $request->input('code'));
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
        $this->service->disconnect((int) $user->id);

        return response()->json(['data' => ['connected' => false]]);
    }

    /** Estado de conexão do usuário autenticado. */
    public function status(): JsonResponse
    {
        $connection = $this->connections->findByAuthenticatedClinicUser();

        return response()->json([
            'data' => [
                'connected'          => $connection->connected,
                'google_calendar_id' => $connection->calendarId,
                'connected_at'       => $connection->connectedAt,
            ],
        ]);
    }

    /**
     * Puxa agora os eventos do Google Calendar do usuário autenticado
     * (síncrono — UX do botão "Atualizar agenda agora"). O polling
     * agendado (~5 min) continua assíncrono no worker.
     */
    public function pull(): JsonResponse
    {
        $connection = $this->connections->findByAuthenticatedClinicUser();

        if (!$connection->connected) {
            return response()->json([
                'message' => 'Conecte o Google Calendar antes de atualizar a agenda.',
            ], 422);
        }

        $user = Auth::guard('clinic')->user();
        PullGoogleCalendarJob::dispatchSync((int) $user->id);

        return response()->json(['data' => ['pulled' => true]]);
    }

    /**
     * @return array{0: int, 1: string}
     */
    private function parseOAuthState(string $encryptedState, string $defaultRedirect): array
    {
        $decoded = Crypt::decryptString($encryptedState);

        // Compat: state antigo era só o id do usuário.
        if (ctype_digit($decoded)) {
            return [(int) $decoded, $defaultRedirect];
        }

        $payload = json_decode($decoded, true, 512, JSON_THROW_ON_ERROR);
        $userId  = (int) ($payload['uid'] ?? 0);

        if ($userId < 1) {
            throw new \InvalidArgumentException('OAuth state sem uid válido.');
        }

        $returnTo = $this->resolveReturnPath($payload['return'] ?? null, $defaultRedirect);

        return [$userId, $returnTo];
    }

    private function resolveReturnPath(mixed $path, ?string $fallback = null): string
    {
        $fallback ??= (string) config('googlecalendar.frontend_redirect', '/clinica/usuarios');

        if (!is_string($path) || empty($path)) {
            return $fallback;
        }

        $normalized = '/' . ltrim(parse_url($path, PHP_URL_PATH) ?: '', '/');

        return in_array($normalized, self::ALLOWED_RETURN_PATHS, true)
            ? $normalized
            : $fallback;
    }
}
