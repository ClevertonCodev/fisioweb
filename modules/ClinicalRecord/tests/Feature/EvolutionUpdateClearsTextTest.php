<?php

namespace Modules\ClinicalRecord\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\ClinicalRecord\Models\PatientEvolution;
use Modules\Patient\Models\Patient;
use Tests\TestCase;

class EvolutionUpdateClearsTextTest extends TestCase
{
    use RefreshDatabase;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    private Patient $patientA;

    private PatientEvolution $draft;

    protected function setUp(): void
    {
        parent::setUp();

        $clinicA        = Clinic::factory()->create();
        $clinicB        = Clinic::factory()->create();
        $this->adminA   = ClinicUser::factory()->create(['clinic_id' => $clinicA->id]);
        $this->adminB   = ClinicUser::factory()->create(['clinic_id' => $clinicB->id]);
        $this->patientA = Patient::factory()->create([
            'clinic_id'      => $clinicA->id,
            'clinic_user_id' => $this->adminA->id,
        ]);
        $this->draft = PatientEvolution::forceCreate([
            'clinic_id'      => $clinicA->id,
            'patient_id'     => $this->patientA->id,
            'clinic_user_id' => $this->adminA->id,
            'title'          => 'Rascunho lombar',
            'generated_text' => 'Alongar cadeia posterior.',
            'notes'          => 'Dor em 4/10.',
            'status'         => PatientEvolution::STATUS_DRAFT,
        ]);
    }

    public function test_update_with_null_generated_text_and_empty_checks_clears_the_sheet(): void
    {
        $this->actingAs($this->adminA, 'clinic')
            ->putJson('/api/clinic/evolutions/' . $this->draft->id, [
                'title'            => 'Rascunho lombar',
                'checked_item_ids' => [],
                'generated_text'   => null,
                'notes'            => 'Dor em 4/10.',
            ])
            ->assertOk();

        $this->assertDatabaseHas('clinic_patient_evolutions', [
            'id'             => $this->draft->id,
            'generated_text' => null,
            'notes'          => 'Dor em 4/10.',
        ]);
    }

    public function test_other_clinic_cannot_clear_the_sheet(): void
    {
        $this->actingAs($this->adminB, 'clinic')
            ->putJson('/api/clinic/evolutions/' . $this->draft->id, [
                'title'            => 'Rascunho lombar',
                'checked_item_ids' => [],
                'generated_text'   => null,
            ])
            ->assertNotFound();

        $this->assertDatabaseHas('clinic_patient_evolutions', [
            'id'             => $this->draft->id,
            'generated_text' => 'Alongar cadeia posterior.',
        ]);
    }
}
