<?php

namespace Modules\GoogleCalendar\Jobs;

use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface;
use Modules\ClinicScheduling\Contracts\Public\AppointmentSyncWriteServiceInterface;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Events\GoogleCalendarEventDeleted;
use Modules\GoogleCalendar\Events\GoogleCalendarEventPushed;

class SyncAppointmentToGoogleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60];

    public const ACTION_UPSERT = 'upsert';

    public const ACTION_DELETE = 'delete';

    private const EVENT_VERSION = 1;

    public function __construct(
        public int $appointmentId,
        public string $action = self::ACTION_UPSERT,
        public ?string $googleEventId = null,
    ) {}

    public function handle(
        GoogleCalendarServiceInterface $service,
        ClinicUserGoogleConnectionReadServiceInterface $connections,
        AppointmentReadServiceInterface $appointments,
        AppointmentSyncWriteServiceInterface $syncWriter,
    ): void {
        $appointment = $appointments->getSnapshotById($this->appointmentId);

        if (is_null($appointment) || is_null($appointment->clinicUserId)) {
            return;
        }

        $connection = $connections->findStateByUserId($appointment->clinicUserId);

        if (is_null($connection) || !$connection->connected) {
            return;
        }

        // DELETE pode ocorrer após cancelamento — usa o id capturado no dispatch.
        if ($this->action === self::ACTION_DELETE) {
            $googleEventId = $this->googleEventId ?: $appointment->googleEventId;

            if (!empty($googleEventId)) {
                $service->deleteAppointment($connection, $googleEventId);
                $this->dispatchEvent(new GoogleCalendarEventDeleted(
                    version: self::EVENT_VERSION,
                    clinicUserId: $connection->clinicUserId,
                    googleEventId: $googleEventId,
                    occurredAt: CarbonImmutable::now(),
                ));
            }

            return;
        }

        $eventId = $service->pushAppointment($connection, $appointment);

        $syncWriter->recordGoogleEventId($appointment->id, $eventId, CarbonImmutable::now());
        $this->dispatchEvent(new GoogleCalendarEventPushed(
            version: self::EVENT_VERSION,
            clinicUserId: $connection->clinicUserId,
            appointmentId: $appointment->id,
            googleEventId: $eventId,
            occurredAt: CarbonImmutable::now(),
        ));
    }

    private function dispatchEvent(object $event): void
    {
        DB::afterCommit(fn () => Event::dispatch($event));
    }

    public function failed(\Throwable $e): void
    {
        Log::error('Falha ao sincronizar consulta com o Google Calendar', [
            'appointment_id' => $this->appointmentId,
            'action'         => $this->action,
            'message'        => $e->getMessage(),
        ]);
    }
}
