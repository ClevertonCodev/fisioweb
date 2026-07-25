<?php

namespace Modules\TreatmentProgram\Tests\Feature\Patient;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\TreatmentProgram\Models\TreatmentPlanExecution;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Tests\TestCase;

class PatientProgramFeedbackCompleteTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpPatientProgramFixtures();
    }

    public function test_feedback_rejects_disabled_dimension(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient, [
            'outcome_pain_enabled' => false,
        ]);

        $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/feedback", [
                'pain'       => 3,
                'difficulty' => 4,
                'rating'     => 'Bom',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['pain']);
    }

    public function test_feedback_does_not_complete_program(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/feedback", [
                'pain'       => 2,
                'difficulty' => 3,
                'rating'     => 'Bom',
            ])
            ->assertOk()
            ->assertJsonStructure(['data' => ['id', 'submitted_at']]);

        $plan->refresh();
        $this->assertSame(0, $plan->patient_completed_count);
    }

    public function test_complete_requires_feedback_when_outcome_flags_enabled(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/complete")
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['feedback']);
    }

    public function test_complete_increments_counter_once_and_is_idempotent(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $executionId = $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/executions")
            ->json('data.id');

        $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/feedback", [
                'pain'         => 1,
                'difficulty'   => 2,
                'rating'       => 'Ótimo',
                'execution_id' => $executionId,
            ])
            ->assertOk();

        $firstComplete = $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/complete");

        $firstComplete->assertOk()
            ->assertJsonPath('data.already_completed', false)
            ->assertJsonPath('data.patient_completed_count', 1);

        $execution = TreatmentPlanExecution::find($executionId);
        $this->assertSame(TreatmentPlanExecution::STATUS_COMPLETED, $execution->status);

        $secondComplete = $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/complete");

        $secondComplete->assertOk()
            ->assertJsonPath('data.already_completed', true)
            ->assertJsonPath('data.patient_completed_count', 1);

        $plan->refresh();
        $this->assertSame(1, $plan->patient_completed_count);
    }

    public function test_complete_without_outcome_flags_does_not_require_feedback(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient, [
            'outcome_pain_enabled'           => false,
            'outcome_difficulty_enabled'     => false,
            'outcome_satisfaction_enabled'   => false,
        ]);

        $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/complete")
            ->assertOk()
            ->assertJsonPath('data.already_completed', false)
            ->assertJsonPath('data.patient_completed_count', 1);
    }

    public function test_feedback_and_complete_work_without_jwt(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $this->postJson("/api/patient/programs/{$plan->public_token}/feedback", [
            'pain'       => 2,
            'difficulty' => 3,
            'rating'     => 'Bom',
        ])->assertOk();

        $this->postJson("/api/patient/programs/{$plan->public_token}/complete")
            ->assertOk()
            ->assertJsonPath('data.already_completed', false)
            ->assertJsonPath('data.patient_completed_count', 1);

        $plan->refresh();
        $this->assertSame(1, (int) $plan->patient_completed_count);
    }
}
