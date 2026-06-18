<?php

namespace Modules\GoogleCalendar\Services;

use Carbon\Carbon;
use Google\Client as GoogleClient;
use Google\Service\Calendar as GoogleCalendar;
use Google\Service\Calendar\Event as GoogleEvent;
use Google\Service\Calendar\EventDateTime;
use Google\Service\Exception as GoogleServiceException;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\ClinicUser;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;

class GoogleCalendarService implements GoogleCalendarServiceInterface
{
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

    public function connectFromCallback(ClinicUser $user, string $code): void
    {
        $client = $this->baseClient();
        $token  = $client->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            throw new \RuntimeException('Falha ao obter tokens do Google: ' . $token['error']);
        }

        $user->forceFill([
            'google_access_token'     => $token['access_token'] ?? null,
            'google_refresh_token'    => $token['refresh_token'] ?? $user->google_refresh_token,
            'google_token_expires_at' => isset($token['expires_in'])
                ? now()->addSeconds((int) $token['expires_in'])
                : null,
            'google_calendar_id'      => 'primary',
            'google_sync_token'       => null,
            'google_connected_at'     => now(),
        ])->save();
    }

    public function disconnect(ClinicUser $user): void
    {
        $user->forceFill([
            'google_access_token'     => null,
            'google_refresh_token'    => null,
            'google_token_expires_at' => null,
            'google_calendar_id'      => null,
            'google_sync_token'       => null,
            'google_connected_at'     => null,
        ])->save();
    }

    public function pushAppointment(ClinicUser $user, Appointment $appointment): string
    {
        $service    = $this->calendarService($user);
        $calendarId = $user->google_calendar_id ?: 'primary';
        $event      = $this->buildEvent($appointment);

        if ($appointment->google_event_id) {
            $saved = $service->events->update($calendarId, $appointment->google_event_id, $event);
        } else {
            $saved = $service->events->insert($calendarId, $event);
        }

        return $saved->getId();
    }

    public function deleteAppointment(ClinicUser $user, string $googleEventId): void
    {
        $service    = $this->calendarService($user);
        $calendarId = $user->google_calendar_id ?: 'primary';

        try {
            $service->events->delete($calendarId, $googleEventId);
        } catch (GoogleServiceException $e) {
            // 404/410: evento já removido no Google — idempotente.
            if (!in_array($e->getCode(), [404, 410], true)) {
                throw $e;
            }
        }
    }

    public function pullChanges(ClinicUser $user): array
    {
        $service    = $this->calendarService($user);
        $calendarId = $user->google_calendar_id ?: 'primary';
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
    private function authenticatedClient(ClinicUser $user): GoogleClient
    {
        $client = $this->baseClient();

        $client->setAccessToken(array_filter([
            'access_token'  => $user->google_access_token,
            'refresh_token' => $user->google_refresh_token,
            'expires_in'    => $user->google_token_expires_at
                ? max(0, $user->google_token_expires_at->diffInSeconds(now(), false) * -1)
                : 0,
        ]));

        if ($client->isAccessTokenExpired() && $user->google_refresh_token) {
            $new = $client->fetchAccessTokenWithRefreshToken($user->google_refresh_token);

            if (!isset($new['error'])) {
                $user->forceFill([
                    'google_access_token'     => $new['access_token'] ?? $user->google_access_token,
                    'google_token_expires_at' => isset($new['expires_in'])
                        ? now()->addSeconds((int) $new['expires_in'])
                        : $user->google_token_expires_at,
                ])->save();
            }
        }

        return $client;
    }

    private function calendarService(ClinicUser $user): GoogleCalendar
    {
        return new GoogleCalendar($this->authenticatedClient($user));
    }

    private function buildEvent(Appointment $appointment): GoogleEvent
    {
        $timezone = $appointment->clinic?->timezone ?: config('app.timezone', 'America/Sao_Paulo');

        $event = new GoogleEvent;
        $event->setSummary($appointment->title ?: 'Consulta');
        $event->setDescription($appointment->description ?: '');
        $event->setLocation($appointment->location ?: '');

        $start = new EventDateTime;
        $start->setDateTime(Carbon::parse($appointment->starts_at)->toRfc3339String());
        $start->setTimeZone($timezone);
        $event->setStart($start);

        $end = new EventDateTime;
        $end->setDateTime(Carbon::parse($appointment->ends_at)->toRfc3339String());
        $end->setTimeZone($timezone);
        $event->setEnd($end);

        return $event;
    }
}
