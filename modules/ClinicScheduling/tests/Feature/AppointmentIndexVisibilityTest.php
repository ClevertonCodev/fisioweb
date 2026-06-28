<?php

namespace Modules\ClinicScheduling\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicScheduling\Enums\AppointmentStatus;
use Modules\ClinicScheduling\Models\Appointment;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class AppointmentIndexVisibilityTest extends TestCase
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

        $this->clinic  = Clinic::factory()->create();
        $this->admin   = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->physioA = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->physioB = ClinicUser::factory()->create(['clinic_id' => $this->clinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $this->patient = Patient::factory()->create(['clinic_id' => $this->clinic->id]);
    }

    private function makeAppointment(ClinicUser $physio, array $overrides = []): Appointment
    {
        return Appointment::factory()->create(array_merge([
            'clinic_id'      => $this->clinic->id,
            'clinic_user_id' => $physio->id,
            'patient_id'     => $this->patient->id,
        ], $overrides));
    }

    public function test_admin_sees_all_clinic_appointments(): void
    {
        $this->makeAppointment($this->physioA);
        $this->makeAppointment($this->physioB);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/appointments')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_physiotherapist_sees_only_own_appointments(): void
    {
        $this->makeAppointment($this->physioA);
        $this->makeAppointment($this->physioB);

        $response = $this->actingAs($this->physioA, 'clinic')
            ->getJson('/api/clinic/appointments')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $response->assertJsonPath('data.0.clinic_user_id', $this->physioA->id);
    }

    public function test_index_filters_by_status(): void
    {
        $this->makeAppointment($this->physioA, ['status' => AppointmentStatus::Scheduled]);
        $this->makeAppointment($this->physioA, ['status' => AppointmentStatus::Cancelled]);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/appointments?status=' . AppointmentStatus::Cancelled->value)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', AppointmentStatus::Cancelled->value);
    }

    public function test_index_filters_by_clinic_user_id_for_manager(): void
    {
        $this->makeAppointment($this->physioA);
        $this->makeAppointment($this->physioB);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/appointments?clinic_user_id=' . $this->physioB->id)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.clinic_user_id', $this->physioB->id);
    }

    public function test_index_does_not_leak_other_clinic_appointments(): void
    {
        $otherClinic  = Clinic::factory()->create();
        $otherPhysio  = ClinicUser::factory()->create(['clinic_id' => $otherClinic->id, 'role' => ClinicUser::ROLE_PHYSIOTHERAPIST]);
        $otherPatient = Patient::factory()->create(['clinic_id' => $otherClinic->id]);
        Appointment::factory()->create([
            'clinic_id'      => $otherClinic->id,
            'clinic_user_id' => $otherPhysio->id,
            'patient_id'     => $otherPatient->id,
        ]);

        $this->makeAppointment($this->physioA);

        $this->actingAs($this->admin, 'clinic')
            ->getJson('/api/clinic/appointments')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
