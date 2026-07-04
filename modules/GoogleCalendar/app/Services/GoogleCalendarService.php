<?php

namespace Modules\GoogleCalendar\Services;

use Carbon\Carbon;
use Carbon\CarbonImmutable;
use Google\Client as GoogleClient;
use Google\Service\Calendar as GoogleCalendar;
use Google\Service\Calendar\Event as GoogleEvent;
use Google\Service\Calendar\EventDateTime;
use Google\Service\Exception as GoogleServiceException;
use Modules\Clinic\Contracts\Public\GoogleCalendarConnectionWriteServiceInterface;
use Modules\Clinic\Data\Public\GoogleConnectionStateDTO;
use Modules\Clinic\Data\Public\GoogleTokenSetDTO;
use Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;

class GoogleCalendarService implements GoogleCalendarServiceInterface
{
    public function __construct(
        protected GoogleCalendarConnectionWriteServiceInterface $connections,
    ) {}

    /** Constrói um client base (sem tokens) com escopo de calendário. */
    private function baseClient(): GoogleClient
    {
        $client = new GoogleClient;
        $client->setClientId((string) config('googlecalendar.client_id'));
        $client->setClientSecret((string) config('googlecalendar.client_secret'));
        $client->setRedirectUri((string) config('googlecalendar.redirect'));
        $client->setScopes([GoogleCalendar::CALENDAR_EVENTS]);
        $client->setAccessType('offline');
        $client->setPrompt('consent');
        $client->setIncludeGrantedScopes(true);

        return $client;
    }

    public function getAuthUrl(string $state): string
    {
        $client = $this->baseClient();
        $client->setState($state);

        return $client->createAuthUrl();
    }

    public function connectFromCallback(int $clinicUserId, string $code): void
    {
        $client = $this->baseClient();
        $token  = $client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            throw new \RuntimeException('Falha ao obter tokens do Google: ' . $token['error']);
        }

        $this->connections->storeTokens($clinicUserId, new GoogleTokenSetDTO(
            accessToken: $token['access_token'] ?? null,
            refreshToken: $token['refresh_token'] ?? null,
            expiresAt: isset($token['expires_in'])
                ? CarbonImmutable::now()->addSeconds((int) $token['expires_in'])
                : null,
            calendarId: 'primary',
            syncToken: null,
            connectedAt: CarbonImmutable::now(),
        ));
    }

    public function disconnect(int $clinicUserId): void
    {
        $this->connections->clearTokens($clinicUserId);
    }

    public function pushAppointment(GoogleConnectionStateDTO $connection, AppointmentSnapshotDTO $appointment): string
    {
        $service    = $this->calendarService($connection);
        $calendarId = $connection->calendarId ?: 'primary';
        $event      = $this->buildEvent($appointment);

        if (!empty($appointment->googleEventId)) {
            $saved = $service->events->update($calendarId, $appointment->googleEventId, $event);
        } else {
            $saved = $service->events->insert($calendarId, $event);
        }

        return $saved->getId();
    }

    public function deleteAppointment(GoogleConnectionStateDTO $connection, string $googleEventId): void
    {
        $service    = $this->calendarService($connection);
        $calendarId = $connection->calendarId ?: 'primary';

        try {
            $service->events->delete($calendarId, $googleEventId);
        } catch (GoogleServiceException $e) {
            // 404/410: evento já removido no Google — idempotente.
            if (!in_array($e->getCode(), [404, 410], true)) {
                throw $e;
            }
        }
    }

    public function pullChanges(GoogleConnectionStateDTO $connection): array
    {
        $service    = $this->calendarService($connection);
        $calendarId = $connection->calendarId ?: 'primary';
        $months     = (int) config('googlecalendar.pull_window_months', 3);

        // Sincronização por janela limitada: evita que eventos recorrentes
        // (singleEvents) sejam expandidos por anos/décadas. orderBy=startTime
        // garante que os eventos próximos não fiquem de fora da paginação.
        $baseParams = [
            'singleEvents' => true,
            'showDeleted'  => true,
            'orderBy'      => 'startTime',
            'maxResults'   => 250,
            'timeMin'      => now()->toRfc3339String(),
            'timeMax'      => now()->addMonths($months)->toRfc3339String(),
        ];

        $events    = [];
        $pageToken = null;

        do {
            $params = $baseParams;
            if ($pageToken) {
                $params['pageToken'] = $pageToken;
            }

            $list   = $service->events->listEvents($calendarId, $params);
            $events = array_merge($events, $list->getItems());

            $pageToken = $list->getNextPageToken();
        } while ($pageToken);

        return [
            'events'        => $events,
            'nextSyncToken' => null,
        ];
    }

    /** Client autenticado para o usuário, com refresh transparente do token. */
    private function authenticatedClient(GoogleConnectionStateDTO $connection): GoogleClient
    {
        $client = $this->baseClient();

        $client->setAccessToken(array_filter([
            'access_token'  => $connection->accessToken,
            'refresh_token' => $connection->refreshToken,
            'expires_in'    => !is_null($connection->tokenExpiresAt)
                ? max(0, $connection->tokenExpiresAt->diffInSeconds(now(), false) * -1)
                : 0,
        ]));

        if ($client->isAccessTokenExpired() && !empty($connection->refreshToken)) {
            $new = $client->fetchAccessTokenWithRefreshToken($connection->refreshToken);

            if (!isset($new['error'])) {
                $this->connections->storeTokens($connection->clinicUserId, new GoogleTokenSetDTO(
                    accessToken: $new['access_token'] ?? $connection->accessToken,
                    refreshToken: $new['refresh_token'] ?? $connection->refreshToken,
                    expiresAt: isset($new['expires_in'])
                        ? CarbonImmutable::now()->addSeconds((int) $new['expires_in'])
                        : $connection->tokenExpiresAt,
                    calendarId: $connection->calendarId ?: 'primary',
                    syncToken: $connection->syncToken,
                    connectedAt: $connection->connectedAt ?: CarbonImmutable::now(),
                ));
            }
        }

        return $client;
    }

    private function calendarService(GoogleConnectionStateDTO $connection): GoogleCalendar
    {
        return new GoogleCalendar($this->authenticatedClient($connection));
    }

    private function buildEvent(AppointmentSnapshotDTO $appointment): GoogleEvent
    {
        $event = new GoogleEvent;
        $event->setSummary($appointment->title ?: 'Consulta');
        $event->setDescription($appointment->description ?: '');
        $event->setLocation($appointment->location ?: '');

        $start = new EventDateTime;
        $start->setDateTime(Carbon::parse($appointment->startsAt)->toRfc3339String());
        $start->setTimeZone($appointment->timezone);
        $event->setStart($start);

        $end = new EventDateTime;
        $end->setDateTime(Carbon::parse($appointment->endsAt)->toRfc3339String());
        $end->setTimeZone($appointment->timezone);
        $event->setEnd($end);

        return $event;
    }
}
