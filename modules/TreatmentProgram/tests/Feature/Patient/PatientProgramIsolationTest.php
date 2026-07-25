<?php

namespace Modules\TreatmentProgram\Tests\Feature\Patient;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Tests\TestCase;

class PatientProgramIsolationTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpPatientProgramFixtures();
    }

    public function test_anonymous_can_read_valid_public_token(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $this->getJson("/api/patient/programs/{$plan->public_token}")
            ->assertOk();
    }

    public function test_anonymous_list_still_requires_auth(): void
    {
        $this->getJson('/api/patient/programs')->assertUnauthorized();
    }

    public function test_anonymous_can_execute_feedback_and_complete_by_public_token(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $this->postJson("/api/patient/programs/{$plan->public_token}/view")->assertOk();
        $this->postJson("/api/patient/programs/{$plan->public_token}/executions")->assertOk();
        $this->postJson("/api/patient/programs/{$plan->public_token}/feedback", [
            'pain'       => 1,
            'difficulty' => 2,
            'rating'     => 'Bom',
        ])->assertOk();
        $this->postJson("/api/patient/programs/{$plan->public_token}/complete")
            ->assertOk()
            ->assertJsonPath('data.patient_completed_count', 1);
    }

    public function test_invalid_token_is_denied_for_writes(): void
    {
        $token = (string) Str::uuid();

        $this->postJson("/api/patient/programs/{$token}/view")->assertNotFound();
        $this->postJson("/api/patient/programs/{$token}/executions")->assertNotFound();
        $this->postJson("/api/patient/programs/{$token}/complete")->assertNotFound();
    }

    public function test_invalid_token_detail_returns_404(): void
    {
        $this->getJson('/api/patient/programs/' . Str::uuid())
            ->assertNotFound();
    }

    public function test_draft_token_is_not_publicly_accessible(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient, [
            'status' => TreatmentPlan::STATUS_DRAFT,
        ]);

        $this->getJson("/api/patient/programs/{$plan->public_token}")
            ->assertNotFound();
        $this->postJson("/api/patient/programs/{$plan->public_token}/complete")
            ->assertNotFound();
    }
}
