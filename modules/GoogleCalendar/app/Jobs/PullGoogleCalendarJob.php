<?php

namespace Modules\GoogleCalendar\Jobs;

use Carbon\CarbonImmutable;
use Google\Service\Calendar\Event as GoogleEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface;
use Modules\Clinic\Contracts\Public\GoogleCalendarConnectionWriteServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentCancelFromExternalSourceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentUpsertFromExternalSourceInterface;
use Modules\ClinicScheduling\Data\Public\AppointmentExternalEventDTO;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Events\GoogleCalendarChangesPulled;
use Modules\GoogleCalendar\Support\GoogleEventDescriptionNormalizer;

class PullGoogleCalendarJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 60, 120];

    private const EVENT_VERSION = 1;

    public function __construct(public int $clinicUserId) {}

    public function handle(
        GoogleCalendarServiceInterface $service,
        ClinicUserGoogleConnectionReadServiceInterface $connections,
        GoogleCalendarConnectionWriteServiceInterface $connectionWriter,
        AppointmentReadServiceInterface $appointmentReader,
        AppointmentUpsertFromExternalSourceInterface $appointmentUpsert,
        AppointmentCancelFromExternalSourceInterface $appointmentCancel,
    ): void {
        $connection = $connections->findStateByUserId($this->clinicUserId);

        if (is_null($connection) || !$connection->connected) {
            return;
        }

        $result = $service->pullChanges($connection);

        foreach ($result['events'] as $event) {
            /** @var GoogleEvent $event */
            $this->applyEvent($connection->clinicId, $connection->clinicUserId, $event, $appointmentReader, $appointmentUpsert, $appointmentCancel);
        }

        if (!empty($result['nextSyncToken'])) {
            $connectionWriter->storeSyncToken($connection->clinicUserId, $result['nextSyncToken']);
        }

        $this->dispatchEvent(new GoogleCalendarChangesPulled(
            version: self::EVENT_VERSION,
            clinicUserId: $connection->clinicUserId,
            pulledEventCount: count($result['events']),
            occurredAt: CarbonImmutable::now(),
        ));
    }

    private function applyEvent(
        int $clinicId,
        int $clinicUserId,
        GoogleEvent $event,
        AppointmentReadServiceInterface $appointmentReader,
        AppointmentUpsertFromExternalSourceInterface $appointmentUpsert,
        AppointmentCancelFromExternalSourceInterface $appointmentCancel,
    ): void {
        $eventId = $event->getId();

        if (empty($eventId)) {
            return;
        }

        // Evento removido/cancelado no Google → cancela no sistema (sem delete).
        if ($event->getStatus() === 'cancelled') {
            $appointmentId = $appointmentReader->findIdByExternalEventId($clinicId, $eventId);

            if (!is_null($appointmentId)) {
                $appointmentCancel->cancelFromExternalSource($appointmentId, CarbonImmutable::now());
            }

            return;
        }

        $start = $this->extractDateTime($event->getStart());
        $end   = $this->extractDateTime($event->getEnd());

        if (is_null($start) || is_null($end)) {
            return; // eventos de dia inteiro sem horário não viram consulta.
        }

        $appointmentUpsert->upsertFromExternalSource(new AppointmentExternalEventDTO(
            clinicId: $clinicId,
            clinicUserId: $clinicUserId,
            patientId: null,
            externalEventId: $eventId,
            title: $event->getSummary() ?: 'Evento Google',
            description: GoogleEventDescriptionNormalizer::toPlainText($event->getDescription()),
            location: $event->getLocation(),
            startsAt: $start,
            endsAt: $end,
            status: 'scheduled',
            source: 'google',
            syncedAt: CarbonImmutable::now(),
        ));
    }

    private function extractDateTime($eventDateTime): ?CarbonImmutable
    {
        if (is_null($eventDateTime)) {
            return null;
        }

        $value = $eventDateTime->getDateTime() ?: null;

        // O Google devolve o horário com offset (ex.: -03:00); normaliza para
        // UTC para casar com o armazenamento do sistema (app.timezone = UTC).
        return !empty($value) ? CarbonImmutable::parse($value)->utc() : null;
    }

    public function failed(\Throwable $e): void
    {
        Log::error('Falha no pull do Google Calendar', [
            'clinic_user_id' => $this->clinicUserId,
            'message'        => $e->getMessage(),
        ]);
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }
}
