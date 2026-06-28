<?php

namespace Modules\ClinicScheduling\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Jobs\AppointmentScheduledNotificationJob;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class AppointmentStoreTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $secretary;

    private ClinicUser $physio;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->clinic    = Clinic::factory()->create();
        $this->secretary = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_SECRETARY]);
        $this->physio    = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->patient   = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
    }

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'patient_id'     => $this->patient->id,
            'clinic_user_id' => $this->physio->id,
            'title'          => 'Avaliação inicial',
            'description'    => 'Primeira consulta',
            'location'       => 'Sala 1',
            'starts_at'      => now()->addDay()->setTime(10, 0)->toIso8601String(),
            'ends_at'        => now()->addDay()->setTime(11, 0)->toIso8601String(),
        ], $overrides);
    }

    public function test_unauthenticated_cannot_create_appointment(): void
    {
        $this->postJson('/api/clinic/appointments', $this->validPayload())
            ->assertUnauthorized();
    }

    public function test_secretary_can_create_appointment_with_scheduled_status(): void
    {
        Queue::fake();

        $response = $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/appointments', $this->validPayload());

        $response->assertCreated()
            ->assertJsonPath('data.status', AppointmentStatus::Scheduled->value)
            ->assertJsonPath('data.clinic_user_id', $this->physio->id)
            ->assertJsonPath('data.patient_id', $this->patient->id);

        $this->assertDatabaseHas('clinic_appointments', [
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physio->id,
            'status'         => AppointmentStatus::Scheduled->value,
            'source'         => 'system',
        ]);
    }

    public function test_creating_appointment_enqueues_notification(): void
    {
        Queue::fake();

        $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/appointments', $this->validPayload())
            ->assertCreated();

        Queue::assertPushed(AppointmentScheduledNotificationJob::class);
    }

    public function test_end_must_be_after_start(): void
    {
        $payload = $this->validPayload([
            'starts_at' => now()->addDay()->setTime(11, 0)->toIso8601String(),
            'ends_at'   => now()->addDay()->setTime(10, 0)->toIso8601String(),
        ]);

        $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/appointments', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('ends_at');
    }

    public function test_patient_from_another_clinic_is_rejected(): void
    {
        $otherPatient = Patient::factory()->create();

        $this->actingAs($this->secretary, 'clinic')
            ->postJson('/api/clinic/appointments', $this->validPayload(['patient_id' => $otherPatient->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('patient_id');
    }
}
