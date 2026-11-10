<?php

namespace Modules\GoogleCalendar\Http\Controllers;

use App\Http\Controllers\ClinicAuthenticatedController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Contracts\GoogleConnectionFlowServiceInterface;
use Modules\GoogleCalendar\Http\Requests\CompleteGoogleConnectionRequest;
use Modules\GoogleCalendar\Jobs\PullGoogleCalendarJob;

class GoogleCalendarController extends ClinicAuthenticatedController
{
    public function __construct(
        protected GoogleCalendarServiceInterface $service,
        protected GoogleConnectionFlowServiceInterface $flow,
        protected ClinicUserGoogleConnectionReadServiceInterface $connections,
    ) {}

    public function connect(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'authorization_url' => $this->flow->authorizationUrl(
                    $this->clinicUserId(),
                    $request->query('return_to'),
                ),
            ],
        ]);
    }

    /**
     * Redirect de navegador vindo do Google, sem JWT: não grava tokens, só
     * entrega um ticket que a tela conclui com o usuário logado.
     */
    public function callback(Request $request): RedirectResponse
    {
        return redirect()->to($this->flow->redirectAfterConsent(
            $request->query('state'),
            $request->query('code'),
            $request->filled('error'),
        ));
    }

    public function complete(CompleteGoogleConnectionRequest $request): JsonResponse
    {
        $this->flow->complete($this->clinicUserId(), $request->string('ticket')->toString());

        return response()->json(['data' => ['connected' => true]]);
    }

    /** Desconecta a conta Google do usuário autenticado. */
    public function disconnect(): JsonResponse
    {
        $this->service->disconnect($this->clinicUserId());

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

        PullGoogleCalendarJob::dispatchSync($this->clinicUserId());

        return response()->json(['data' => ['pulled' => true]]);
    }
}
