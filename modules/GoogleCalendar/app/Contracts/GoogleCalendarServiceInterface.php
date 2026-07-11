<?php

namespace Modules\GoogleCalendar\Contracts;

use Modules\Clinic\Data\Public\GoogleConnectionStateDTO;
use Modules\ClinicScheduling\Data\Public\AppointmentSnapshotDTO;

interface GoogleCalendarServiceInterface
{
    /** URL de consentimento OAuth; `state` carrega o id do usuário da clínica. */
    public function getAuthUrl(string $state): string;

    /**
     * Troca o `code` por tokens e solicita persistência ao módulo Clinic.
     */
    public function connectFromCallback(int $clinicUserId, string $code): void;

    /** Desconecta: limpa tokens e metadados Google do usuário. */
    public function disconnect(int $clinicUserId): void;

    /**
     * Cria/atualiza o evento no Google Calendar do responsável e devolve o
     * `google_event_id`. Idempotente quando a consulta já tem evento.
     */
    public function pushAppointment(GoogleConnectionStateDTO $connection, AppointmentSnapshotDTO $appointment): string;

    /** Remove o evento correspondente à consulta no Google. */
    public function deleteAppointment(GoogleConnectionStateDTO $connection, string $googleEventId): void;

    /**
     * Lista alterações incrementais (syncToken) do calendário do usuário.
     * Retorna ['events' => Google_Service_Calendar_Event[], 'nextSyncToken' => ?string].
     * Em 410 (token expirado) sinaliza full resync limpando o syncToken.
     */
    public function pullChanges(GoogleConnectionStateDTO $connection): array;
}
