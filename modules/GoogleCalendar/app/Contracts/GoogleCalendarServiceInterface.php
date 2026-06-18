<?php

namespace Modules\GoogleCalendar\Contracts;

use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\ClinicUser;

interface GoogleCalendarServiceInterface
{
    /** URL de consentimento OAuth; `state` carrega o id do usuário da clínica. */
    public function getAuthUrl(string $state): string;

    /**
     * Troca o `code` por tokens e persiste no ClinicUser (access/refresh,
     * expiração, calendar_id, connected_at).
     */
    public function connectFromCallback(ClinicUser $user, string $code): void;

    /** Desconecta: limpa tokens e metadados Google do usuário. */
    public function disconnect(ClinicUser $user): void;

    /**
     * Cria/atualiza o evento no Google Calendar do responsável e devolve o
     * `google_event_id`. Idempotente quando a consulta já tem evento.
     */
    public function pushAppointment(ClinicUser $user, Appointment $appointment): string;

    /** Remove o evento correspondente à consulta no Google. */
    public function deleteAppointment(ClinicUser $user, string $googleEventId): void;

    /**
     * Lista alterações incrementais (syncToken) do calendário do usuário.
     * Retorna ['events' => Google_Service_Calendar_Event[], 'nextSyncToken' => ?string].
     * Em 410 (token expirado) sinaliza full resync limpando o syncToken.
     */
    public function pullChanges(ClinicUser $user): array;
}
