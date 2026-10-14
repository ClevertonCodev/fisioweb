<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class PatientClinicIsolationTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $adminA;

    private Patient $patientA;

    private Patient $patientB;

    protected function setUp(): void
    {
        parent::setUp();

        $clinicA      = Clinic::factory()->create();
        $clinicB      = Clinic::factory()->create();
        $this->adminA = ClinicUser::factory()->create(['clinic_id' => $clinicA->id]);
        $adminB       = ClinicUser::factory()->create(['clinic_id' => $clinicB->id]);

        $this->patientA = Patient::factory()->create([
            'clinic_id'      => $clinicA->id,
            'clinic_user_id' => $this->adminA->id,
            'name'           => 'Paciente A',
            'photo_url'      => 'https://cdn.example.com/a.jpg',
            'is_active'      => true,
        ]);
        $this->patientB = Patient::factory()->create([
            'clinic_id'      => $clinicB->id,
            'clinic_user_id' => $adminB->id,
            'name'           => 'Paciente B',
            'photo_url'      => 'https://cdn.example.com/b.jpg',
            'is_active'      => true,
        ]);
    }

    public function test_show_returns_own_patient_and_hides_another_clinic_patient(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientA->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $this->patientA->id);

        $this->actingAs($this->adminA, 'clinic')
            ->getJson("/api/clinic/patients/{$this->patientB->id}")
            ->assertNotFound();
    }

    public function test_update_changes_own_patient_and_not_another_clinic_patient(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/patients/{$this->patientA->id}", ['name' => 'Paciente A Editado'])
            ->assertOk();

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/patients/{$this->patientB->id}", ['name' => 'Alterado por A'])
            ->assertNotFound();

        $this->assertDatabaseHas('patients', ['id' => $this->patientA->id, 'name' => 'Paciente A Editado']);
        $this->assertDatabaseHas('patients', ['id' => $this->patientB->id, 'name' => 'Paciente B']);
    }

    public function test_delete_photo_clears_own_patient_photo_and_not_another_clinic_photo(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/patients/{$this->patientA->id}/photo")
            ->assertOk();

        $this->actingAs($this->adminA, 'clinic')
            ->deleteJson("/api/clinic/patients/{$this->patientB->id}/photo")
            ->assertNotFound();

        $this->assertDatabaseHas('patients', ['id' => $this->patientA->id, 'photo_url' => null]);
        $this->assertDatabaseHas('patients', ['id' => $this->patientB->id, 'photo_url' => 'https://cdn.example.com/b.jpg']);
    }

    public function test_bulk_inactivate_only_reaches_own_clinic_patients(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->postJson('/api/clinic/patients/bulk-inactivate', ['ids' => [$this->patientA->id, $this->patientB->id]])
            ->assertOk()
            ->assertJsonPath('count', 1);

        $this->assertDatabaseHas('patients', ['id' => $this->patientA->id, 'is_active' => false]);
        $this->assertDatabaseHas('patients', ['id' => $this->patientB->id, 'is_active' => true]);
    }
}
