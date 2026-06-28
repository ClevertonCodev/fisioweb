<?php

namespace Modules\GoogleCalendar\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;

class SyncAppointmentToGoogleJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60];

    public const ACTION_UPSERT = 'upsert';

    public const ACTION_DELETE = 'delete';

    public function __construct(
        public int $appointmentId,
        public string $action = self::ACTION_UPSERT,
        public ?string $googleEventId = null,
    ) {}

    public function handle(GoogleCalendarServiceInterface $service): void
    {
        // DELETE pode ocorrer após cancelamento — usa o id capturado no dispatch.
        if ($this->action === self::ACTION_DELETE) {
            $appointment = Appointment::find($this->appointmentId);
            $user        = $appointment?->clinicUser;

            if ($user?->isGoogleConnected() && $this->googleEventId) {
                $service->deleteAppointment($user, $this->googleEventId);
            }

            return;
        }

        $appointment = Appointment::with(['clinicUser', 'clinic'])->find($this->appointmentId);

        if (!$appointment) {
            return;
        }

        $user = $appointment->clinicUser;

        if (!$user || !$user->isGoogleConnected()) {
            return;
        }

        $eventId = $service->pushAppointment($user, $appointment);

        // Idempotência: registra o evento e a marca de sincronização sem
        // disparar observers/eventos que reabririam o ciclo (anti-loop).
        $appointment->forceFill([
            'google_event_id' => $eventId,
            'last_synced_at'  => now(),
        ])->saveQuietly();
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
