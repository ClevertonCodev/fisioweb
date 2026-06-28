<?php

namespace Modules\GoogleCalendar\Tests\Unit;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\ClinicScheduling\Services\AppointmentService;
use Modules\GoogleCalendar\Contracts\GoogleCalendarServiceInterface;
use Modules\GoogleCalendar\Jobs\SyncAppointmentToGoogleJob;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class SyncAppointmentToGoogleJobTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic  = Clinic::factory()->create();
        $this->patient = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
    }

    private function makeData(ClinicUser $physio): array
    {
        return [
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $physio->id,
            'patient_id'     => $this->patient->id,
            'starts_at'      => now()->addDay()->setTime(10, 0),
            'ends_at'        => now()->addDay()->setTime(11, 0),
        ];
    }

    public function test_push_dispatched_when_responsible_is_connected(): void
    {
        Queue::fake();

        $physio = ClinicUser::factory()->create([
            'clinic_id'           => $this->clinic->id,
            'role'                => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'google_connected_at' => now(),
        ]);

        app(AppointmentService::class)->create($this->makeData($physio));

        Queue::assertPushed(SyncAppointmentToGoogleJob::class);
    }

    public function test_push_not_dispatched_when_not_connected(): void
    {
        Queue::fake();

        $physio = ClinicUser::factory()->create([
            'clinic_id' => $this->clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        app(AppointmentService::class)->create($this->makeData($physio));

        Queue::assertNotPushed(SyncAppointmentToGoogleJob::class);
    }

    public function test_job_persists_google_event_id_idempotently(): void
    {
        $physio = ClinicUser::factory()->create([
            'clinic_id'           => $this->clinic->id,
            'role'                => ClinicUser::ROLE_PHYSIOTHERAPIST,
            'google_connected_at' => now(),
        ]);

        $appointment = Appointment::factory()->create([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $physio->id,
            'patient_id'     => $this->patient->id,
        ]);

        $this->mock(GoogleCalendarServiceInterface::class, function ($mock) {
            $mock->shouldReceive('pushAppointment')->once()->andReturn('google-event-123');
        });

        (new SyncAppointmentToGoogleJob($appointment->id))
            ->handle(app(GoogleCalendarServiceInterface::class));

        $this->assertSame('google-event-123', $appointment->fresh()->google_event_id);
        $this->assertNotNull($appointment->fresh()->last_synced_at);
    }
}
