<?php

namespace Modules\TreatmentProgram\Tests\Feature\Patient;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Tests\TestCase;

class PatientProgramListTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpPatientProgramFixtures();
    }

    public function test_list_requires_authentication(): void
    {
        $this->getJson('/api/patient/programs')
            ->assertUnauthorized();
    }

    public function test_patient_lists_only_own_programs(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);
        $this->createActiveProgram($patient, ['title' => 'Segundo Programa']);

        $otherPatient = Patient::factory()->create(['clinic_id' => $this->clinicUser->clinic_id]);
        $this->createActiveProgram($otherPatient, ['title' => 'Programa de Outro Paciente']);

        $response = $this->actingAs($patient, 'patient')
            ->getJson('/api/patient/programs');

        $response->assertOk()
            ->assertJsonCount(2, 'data');

        $titles = collect($response->json('data'))->pluck('name')->all();
        $this->assertContains('Programa de Reabilitação', $titles);
        $this->assertContains('Segundo Programa', $titles);
        $this->assertNotContains('Programa de Outro Paciente', $titles);
    }

    public function test_draft_programs_are_excluded(): void
    {
        $patient = $this->createPatient();
        $this->createActiveProgram($patient);
        $this->createActiveProgram($patient, [
            'title'  => 'Rascunho',
            'status' => TreatmentPlan::STATUS_DRAFT,
        ]);

        $response = $this->actingAs($patient, 'patient')
            ->getJson('/api/patient/programs');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_list_includes_derived_status_and_exercise_count(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient, [
            'start_date' => now()->addWeek()->toDateString(),
        ]);

        $response = $this->actingAs($patient, 'patient')
            ->getJson('/api/patient/programs');

        $response->assertOk()
            ->assertJsonPath('data.0.public_token', $plan->public_token)
            ->assertJsonPath('data.0.status', 'scheduled')
            ->assertJsonPath('data.0.exercise_count', 1);
    }

    public function test_programs_from_other_clinic_are_not_listed(): void
    {
        $patient = $this->createPatient();
        $this->createActiveProgram($patient);

        $otherClinicUser = ClinicUser::factory()->create();
        $otherPatient    = Patient::factory()->create(['clinic_id' => $otherClinicUser->clinic_id]);
        TreatmentPlan::create([
            'clinic_id'      => $otherClinicUser->clinic_id,
            'clinic_user_id' => $otherClinicUser->id,
            'patient_id'     => $otherPatient->id,
            'title'          => 'Outra clínica',
            'status'         => TreatmentPlan::STATUS_ACTIVE,
        ]);

        $response = $this->actingAs($patient, 'patient')
            ->getJson('/api/patient/programs');

        $response->assertOk()
            ->assertJsonCount(1, 'data');
    }
}
