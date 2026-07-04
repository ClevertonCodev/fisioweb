<?php

namespace Modules\GoogleCalendar\Tests\Unit;

use Google\Service\Calendar\Event as GoogleEvent;
use Google\Service\Calendar\EventDateTime;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Jobs\PullGoogleCalendarJob;
use Tests\TestCase;

class PullGoogleCalendarJobTest extends TestCase
{
    use RefreshDatabase;

    public function test_pull_upserts_google_event_through_public_contracts(): void
    {
        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create([
            'clinic_id'           => $clinic->id,
            'role'                => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'google_connected_at' => now(),
        ]);

        $this->mock(GoogleCalendarServiceInterface::class, function ($mock) {
            $mock->shouldReceive('pullChanges')->once()->andReturn([
                'events'        => [$this->googleEvent('google-event-1')],
                'nextSyncToken' => 'sync-token-1',
            ]);
        });

        $this->handleJob($user->id);

        $this->assertDatabaseHas('clinic_appointments', [
            'clinic_id'       => $clinic->id,
            'clinic_user_id'  => $user->id,
            'google_event_id' => 'google-event-1',
            'source'          => 'google',
            'status'          => AppointmentStatus::Scheduled->value,
        ]);

        $this->assertSame('sync-token-1', $user->fresh()->google_sync_token);
    }

    public function test_pull_cancels_existing_google_event_through_public_contracts(): void
    {
        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create([
            'clinic_id'           => $clinic->id,
            'role'                => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'google_connected_at' => now(),
        ]);

        $appointment = Appointment::factory()->create([
            'clinic_id'       => $clinic->id,
            'clinic_user_id'  => $user->id,
            'google_event_id' => 'google-event-1',
            'status'          => AppointmentStatus::Scheduled,
        ]);

        $event = $this->googleEvent('google-event-1');
        $event->setStatus('cancelled');

        $this->mock(GoogleCalendarServiceInterface::class, function ($mock) use ($event) {
            $mock->shouldReceive('pullChanges')->once()->andReturn([
                'events'        => [$event],
                'nextSyncToken' => null,
            ]);
        });

        $this->handleJob($user->id);

        $this->assertSame(AppointmentStatus::Cancelled, $appointment->fresh()->status);
        $this->assertNotNull($appointment->fresh()->last_synced_at);
    }

    private function handleJob(int $clinicUserId): void
    {
        (new PullGoogleCalendarJob($clinicUserId))->handle(
            app(GoogleCalendarServiceInterface::class),
            app(\Modules\Clinic\Contracts\Public\ClinicUserGoogleConnectionReadServiceInterface::class),
            app(\Modules\Clinic\Contracts\Public\GoogleCalendarConnectionWriteServiceInterface::class),
            app(\Modules\ClinicScheduling\Contracts\Public\AppointmentReadServiceInterface::class),
            app(\Modules\ClinicScheduling\Contracts\Public\AppointmentUpsertFromExternalSourceInterface::class),
            app(\Modules\ClinicScheduling\Contracts\Public\AppointmentCancelFromExternalSourceInterface::class),
        );
    }

    private function googleEvent(string $id): GoogleEvent
    {
        $event = new GoogleEvent;
        $event->setId($id);
        $event->setSummary('Google event');
        $event->setDescription('Pulled from Google');
        $event->setLocation('Room 1');

        $start = new EventDateTime;
        $start->setDateTime(now()->addDay()->setTime(10, 0)->toRfc3339String());
        $event->setStart($start);

        $end = new EventDateTime;
        $end->setDateTime(now()->addDay()->setTime(11, 0)->toRfc3339String());
        $event->setEnd($end);

        return $event;
    }
}
