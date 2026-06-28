<?php

namespace Modules\ClinicScheduling\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class AppointmentAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinic;

    private ClinicUser $admin;

    private ClinicUser $physioA;

    private ClinicUser $physioB;

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

        $this->clinic  = Clinic::factory()->create();
        $this->admin   = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->physioA = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->physioB = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->patient = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'patient_id'     => $this->patient->id,
            'clinic_user_id' => $this->physioA->id,
            'starts_at'      => now()->addDay()->setTime(10, 0)->toIso8601String(),
            'ends_at'        => now()->addDay()->setTime(11, 0)->toIso8601String(),
        ], $overrides);
    }

    public function test_physiotherapist_booking_for_another_is_forced_to_self(): void
    {
        // Fisio A tenta marcar para Fisio B — o backend força o responsável = A.
        $this->actingAs($this->physioA, 'clinic')
            ->postJson('/api/clinic/appointments', $this->payload(['clinic_user_id' => $this->physioB->id]))
            ->assertCreated()
            ->assertJsonPath('data.clinic_user_id', $this->physioA->id);

        $this->assertDatabaseHas('clinic_appointments', [
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $this->physioA->id,
        ]);
        $this->assertDatabaseMissing('clinic_appointments', [
            'clinic_user_id' => $this->physioB->id,
        ]);
    }

    public function test_admin_can_book_for_any_physiotherapist(): void
    {
        $this->actingAs($this->admin, 'clinic')
            ->postJson('/api/clinic/appointments', $this->payload(['clinic_user_id' => $this->physioB->id]))
            ->assertCreated()
            ->assertJsonPath('data.clinic_user_id', $this->physioB->id);
    }

    public function test_cannot_book_for_physiotherapist_of_another_clinic(): void
    {
        $otherPhysio = ClinicUser::factory()->create(['role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);

        $this->actingAs($this->admin, 'clinic')
            ->postJson('/api/clinic/appointments', $this->payload(['clinic_user_id' => $otherPhysio->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('clinic_user_id');
    }
}
