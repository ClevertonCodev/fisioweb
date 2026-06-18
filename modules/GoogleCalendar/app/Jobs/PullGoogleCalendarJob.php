<?php

namespace Modules\GoogleCalendar\Jobs;

use Carbon\Carbon;
use Google\Service\Calendar\Event as GoogleEvent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Modules\Clinic\Enums\AppointmentStatus;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\ClinicUser;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;

class PullGoogleCalendarJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [30, 60, 120];

    public function __construct(public int $clinicUserId) {}

    public function handle(GoogleCalendarServiceInterface $service): void
    {
        $user = ClinicUser::find($this->clinicUserId);

        if (!$user || !$user->isGoogleConnected()) {
            return;
        }

        $result = $service->pullChanges($user);

        foreach ($result['events'] as $event) {
            /** @var GoogleEvent $event */
            $this->applyEvent($user, $event);
        }

        if (!empty($result['nextSyncToken'])) {
            $user->forceFill(['google_sync_token' => $result['nextSyncToken']])->save();
        }
    }

    private function applyEvent(ClinicUser $user, GoogleEvent $event): void
    {
        $eventId = $event->getId();

        if (!$eventId) {
            return;
        }

        $existing = Appointment::where('clinic_id', $user->clinic_id)
            ->where('google_event_id', $eventId)
            ->first();

        // Evento removido/cancelado no Google → cancela no sistema (sem delete).
        if ($event->getStatus() === 'cancelled') {
            if ($existing && $existing->status !== AppointmentStatus::Cancelled) {
                $existing->forceFill([
                    'status'         => AppointmentStatus::Cancelled,
                    'last_synced_at' => now(),
                ])->saveQuietly();
            }

            return;
        }

        $start = $this->extractDateTime($event->getStart());
        $end   = $this->extractDateTime($event->getEnd());

        if (!$start || !$end) {
            return; // eventos de dia inteiro sem horário não viram consulta.
        }

        $payload = [
            'title'          => $event->getSummary() ?: 'Evento Google',
            'description'    => $event->getDescription(),
            'location'       => $event->getLocation(),
            'starts_at'      => $start,
            'ends_at'        => $end,
            'last_synced_at' => now(),
        ];

        if ($existing) {
            // Anti-loop: saveQuietly não dispara push de volta.
            $existing->forceFill($payload)->saveQuietly();

            return;
        }

        Appointment::withoutEvents(fn () => Appointment::create(array_merge($payload, [
            'clinic_id'       => $user->clinic_id,
            'clinic_user_id'  => $user->id,
            'patient_id'      => null,
            'status'          => AppointmentStatus::Scheduled,
            'source'          => Appointment::SOURCE_GOOGLE,
            'google_event_id' => $eventId,
        ])));
    }

    private function extractDateTime($eventDateTime): ?Carbon
    {
        if (!$eventDateTime) {
            return null;
        }

        $value = $eventDateTime->getDateTime() ?: null;

        // O Google devolve o horário com offset (ex.: -03:00); normaliza para
        // UTC para casar com o armazenamento do sistema (app.timezone = UTC).
        return $value ? Carbon::parse($value)->utc() : null;
    }

    public function failed(\Throwable $e): void
    {
        Log::error('Falha no pull do Google Calendar', [
            'clinic_user_id' => $this->clinicUserId,
            'message'        => $e->getMessage(),
        ]);
    }
}
