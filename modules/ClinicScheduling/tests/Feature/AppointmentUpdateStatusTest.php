<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Enums\AppointmentStatus;
use Modules\Clinic\Models\Appointment;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class AppointmentUpdateStatusTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $physio;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->clinic  = Clinic::factory()->create();
        $this->admin   = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->physio  = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->patient = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
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

    public function test_can_confirm_a_scheduled_appointment(): void
    {
        $appointment = $this->makeAppointment();

        $this->actingAs($this->admin, 'clinic')
            ->patchJson("/api/clinic/appointments/{$appointment->id}/status", [
                'status' => AppointmentStatus::Confirmed->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::Confirmed->value);

        $this->assertDatabaseHas('clinic_appointments', [
            'id'     => $appointment->id,
            'status' => AppointmentStatus::Confirmed->value,
        ]);
    }

    public function test_cannot_complete_before_start_time(): void
    {
        $appointment = $this->makeAppointment([
            'starts_at' => now()->addDay()->setTime(10, 0),
            'ends_at'   => now()->addDay()->setTime(11, 0),
        ]);

        $this->actingAs($this->admin, 'clinic')
            ->patchJson("/api/clinic/appointments/{$appointment->id}/status", [
                'status' => AppointmentStatus::Completed->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_cannot_reopen_a_cancelled_appointment(): void
    {
        $appointment = $this->makeAppointment(['status' => AppointmentStatus::Cancelled]);

        $this->actingAs($this->admin, 'clinic')
            ->patchJson("/api/clinic/appointments/{$appointment->id}/status", [
                'status' => AppointmentStatus::Scheduled->value,
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }

    public function test_cancel_keeps_record_with_cancelled_status(): void
    {
        $appointment = $this->makeAppointment();

        $this->actingAs($this->admin, 'clinic')
            ->postJson("/api/clinic/appointments/{$appointment->id}/cancel")
            ->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::Cancelled->value);

        $this->assertDatabaseHas('clinic_appointments', [
            'id'     => $appointment->id,
            'status' => AppointmentStatus::Cancelled->value,
        ]);
    }

    public function test_can_update_appointment_details(): void
    {
        $appointment = $this->makeAppointment();

        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/appointments/{$appointment->id}", [
                'patient_id'     => $this->patient->id,
                'clinic_user_id' => $this->physio->id,
                'title'          => 'Reavaliação',
                'location'       => 'Sala 2',
                'starts_at'      => now()->addDays(2)->setTime(14, 0)->toIso8601String(),
                'ends_at'        => now()->addDays(2)->setTime(15, 0)->toIso8601String(),
            ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Reavaliação')
            ->assertJsonPath('data.location', 'Sala 2');
    }

    public function test_update_does_not_change_status(): void
    {
        $appointment = $this->makeAppointment(['status' => AppointmentStatus::Confirmed]);

        $this->actingAs($this->admin, 'clinic')
            ->putJson("/api/clinic/appointments/{$appointment->id}", [
                'title'  => 'Novo título',
                'status' => AppointmentStatus::Cancelled->value,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::Confirmed->value);
    }

    public function test_cannot_touch_appointment_of_another_clinic(): void
    {
        $otherClinic  = Clinic::factory()->create();
        $otherPhysio  = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $otherPatient = Patient::factory()->create(['clinic_id' => $otherClinic->id]);
        $foreign      = Appointment::factory()->create([
            'clinic_id'      => $otherClinic->id,
            'clinic_user_id' => $otherPhysio->id,
            'patient_id'     => $otherPatient->id,
        ]);

        $this->actingAs($this->admin, 'clinic')
            ->postJson("/api/clinic/appointments/{$foreign->id}/cancel")
            ->assertNotFound();
    }
}
