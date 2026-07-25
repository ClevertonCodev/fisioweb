<?php

namespace Modules\TreatmentProgram\Tests\Feature\Patient;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\TreatmentProgram\Models\TreatmentPlan;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Tests\TestCase;

class PatientProgramDetailTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpPatientProgramFixtures();
    }

    public function test_public_detail_returns_200_without_jwt(): void
    {
        $patient                                           = $this->createPatient();
        ['plan' => $plan, 'planExercise' => $planExercise] = $this->createActiveProgram($patient);

        $response = $this->getJson("/api/patient/programs/{$plan->public_token}");

        $response->assertOk()
            ->assertJsonPath('data.public_token', $plan->public_token)
            ->assertJsonPath('data.name', 'Programa de Reabilitação')
            ->assertJsonPath('data.status', 'available')
            ->assertJsonPath('data.current_execution', null)
            ->assertJsonPath('data.groups.0.exercises.0.id', $planExercise->id)
            ->assertJsonPath('data.groups.0.exercises.0.video_url', 'http://cdn.example.com/video.mp4');
    }

    public function test_draft_program_returns_404(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient, [
            'status' => TreatmentPlan::STATUS_DRAFT,
        ]);

        $this->getJson("/api/patient/programs/{$plan->public_token}")
            ->assertNotFound();
    }

    public function test_invalid_token_returns_404(): void
    {
        $this->getJson('/api/patient/programs/' . Str::uuid())
            ->assertNotFound();
    }

    public function test_view_is_public_and_idempotent_without_jwt(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $this->assertNull($plan->patient_viewed_at);

        $this->postJson("/api/patient/programs/{$plan->public_token}/view")
            ->assertOk()
            ->assertJsonPath('data.viewed', true);

        $plan->refresh();
        $firstViewedAt = $plan->patient_viewed_at;
        $this->assertNotNull($firstViewedAt);

        $this->postJson("/api/patient/programs/{$plan->public_token}/view")
            ->assertOk();

        $plan->refresh();
        $this->assertTrue($plan->patient_viewed_at->equalTo($firstViewedAt));
    }

    public function test_authenticated_owner_sees_current_execution_on_detail(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $start = $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/executions");

        $start->assertOk();
        $executionId = $start->json('data.id');

        $detail = $this->actingAs($patient, 'patient')
            ->getJson("/api/patient/programs/{$plan->public_token}");

        $detail->assertOk()
            ->assertJsonPath('data.current_execution.id', $executionId);
    }
}
