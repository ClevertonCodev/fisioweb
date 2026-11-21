<?php

namespace Modules\ClinicScheduling\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Events\AppointmentEmailRequested;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class AppointmentSendEmailTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $secretary;

    private ClinicUser $physio;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->clinic    = Clinic::factory()->create();
        $this->secretary = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->physio    = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->patient   = Patient::factory()->forClinic($this->clinic)->create(['email' => 'paciente@example.test']);
    }

    private function makeAppointment(array $overrides = []): Appointment
    {
        return Appointment::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physio->id,
            'patient_id'     => $this->patient->id,
            'status'         => AppointmentStatus::Scheduled,
            'starts_at'      => now()->addDay()->setTime(10, 0),
            'ends_at'        => now()->addDay()->setTime(11, 0),
        ], $overrides));
    }

    public function test_scheduled_kind_returns_202_and_dispatches_event(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $appointment = $this->makeAppointment();

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertStatus(202)
            ->assertExactJson(['data' => ['queued' => true]]);

        Event::assertDispatched(AppointmentEmailRequested::class, function (AppointmentEmailRequested $event) use ($appointment): bool {
            return $event->version === 1
                && $event->clinicId === $this->clinic->id
                && $event->appointmentId === $appointment->id
                && $event->patientId === $this->patient->id
                && $event->actorId === $this->secretary->id
                && $event->kind === 'scheduled'
                && $event->occurredAt->isToday();
        });
    }

    public function test_appointment_of_another_clinic_returns_404_and_dispatches_nothing(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $appointment = $this->makeAppointment();

        $otherClinic = Clinic::factory()->create();
        $otherAdmin  = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id, 'role' => ClinicUser::ROLE_ADMIN]);

        $this->actingAs($otherAdmin, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertNotFound();

        Event::assertNotDispatched(AppointmentEmailRequested::class);
    }

    public function test_physiotherapist_cannot_notify_another_professionals_appointment(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $otherPhysio = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $appointment = $this->makeAppointment(['clinic_user_id' => $otherPhysio->id]);

        $this->actingAs($this->physio, 'clinic')
            ->putJson("/api/clinic/appointments/{$appointment->id}", [
                'patient_id'     => $this->patient->id,
                'clinic_user_id' => $otherPhysio->id,
                'starts_at'      => now()->addDays(2)->setTime(10, 0)->toIso8601String(),
                'ends_at'        => now()->addDays(2)->setTime(11, 0)->toIso8601String(),
            ])
            ->assertForbidden();

        $this->actingAs($this->physio, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertForbidden();

        Event::assertNotDispatched(AppointmentEmailRequested::class);
    }

    public function test_physiotherapist_can_notify_own_appointment(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $appointment = $this->makeAppointment();

        $this->actingAs($this->physio, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertStatus(202);

        Event::assertDispatched(AppointmentEmailRequested::class);
    }

    public function test_appointment_without_patient_returns_422(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $appointment = $this->makeAppointment(['patient_id' => null]);

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['patient' => 'Esta consulta não tem paciente.']);

        Event::assertNotDispatched(AppointmentEmailRequested::class);
    }

    public function test_patient_without_email_returns_422(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $this->patient->forceFill(['email' => ''])->save();
        $appointment = $this->makeAppointment();

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        Event::assertNotDispatched(AppointmentEmailRequested::class);
    }

    public function test_kind_incoherent_with_status_returns_422(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $cancelled = $this->makeAppointment(['status' => AppointmentStatus::Cancelled]);
        $scheduled = $this->makeAppointment();

        foreach (['scheduled', 'rescheduled'] as $kind) {
            $this->actingAs($this->secretary, 'clinic')
                ->postJson("/api/clinic/appointments/{$cancelled->id}/email", ['kind' => $kind])
                ->assertStatus(422)
                ->assertJsonValidationErrors('kind');
        }

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$scheduled->id}/email", ['kind' => 'cancelled'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('kind');

        Event::assertNotDispatched(AppointmentEmailRequested::class);
    }

    public function test_kind_coherent_with_status_is_accepted_for_rescheduled_and_cancelled(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $cancelled = $this->makeAppointment(['status' => AppointmentStatus::Cancelled]);
        $confirmed = $this->makeAppointment(['status' => AppointmentStatus::Confirmed]);

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$cancelled->id}/email", ['kind' => 'cancelled'])
            ->assertStatus(202);
        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$confirmed->id}/email", ['kind' => 'rescheduled'])
            ->assertStatus(202);

        Event::assertDispatchedTimes(AppointmentEmailRequested::class, 2);
    }

    public function test_missing_or_unknown_kind_returns_422(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $appointment = $this->makeAppointment();

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('kind');
        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'reminder'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('kind');

        Event::assertNotDispatched(AppointmentEmailRequested::class);
    }

    public function test_deleted_patient_returns_422(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $appointment = $this->makeAppointment();
        $this->patient->delete();

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('patient');

        Event::assertNotDispatched(AppointmentEmailRequested::class);
    }

    public function test_sixth_request_in_same_minute_by_same_user_returns_429_without_blocking_others(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $appointment = $this->makeAppointment();

        for ($i = 0; $i < 5; $i++) {
            $this->actingAs($this->secretary, 'clinic')
                ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
                ->assertStatus(202);
        }

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertStatus(429);

        $this->actingAs($this->physio, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertStatus(202);

        Event::assertDispatchedTimes(AppointmentEmailRequested::class, 6);
    }

    public function test_patient_with_malformed_email_returns_422(): void
    {
        Event::fake([AppointmentEmailRequested::class]);
        $this->patient->forceFill(['email' => 'sem-arroba'])->save();
        $appointment = $this->makeAppointment();

        $this->actingAs($this->secretary, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/email", ['kind' => 'scheduled'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        Event::assertNotDispatched(AppointmentEmailRequested::class);
    }
}
