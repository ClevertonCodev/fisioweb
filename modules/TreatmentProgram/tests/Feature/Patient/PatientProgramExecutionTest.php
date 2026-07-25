<?php

namespace Modules\TreatmentProgram\Tests\Feature\Patient;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\TreatmentProgram\Models\TreatmentPlanExecution;
use Modules\TreatmentProgram\Models\TreatmentPlanExecutionSeries;
use Modules\TreatmentProgram\Tests\Support\CreatesPatientProgramFixtures;
use Tests\TestCase;

class PatientProgramExecutionTest extends TestCase
{
    use CreatesPatientProgramFixtures;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setUpPatientProgramFixtures();
    }

    public function test_start_execution_works_without_jwt(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $this->postJson("/api/patient/programs/{$plan->public_token}/executions")
            ->assertOk()
            ->assertJsonPath('data.resumed', false);
    }

    public function test_start_then_resume_returns_same_execution(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient);

        $first = $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/executions");

        $first->assertOk()
            ->assertJsonPath('data.resumed', false)
            ->assertJsonPath('data.status', TreatmentPlanExecution::STATUS_IN_PROGRESS);

        $executionId = $first->json('data.id');

        $second = $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/executions");

        $second->assertOk()
            ->assertJsonPath('data.id', $executionId)
            ->assertJsonPath('data.resumed', true);
    }

    public function test_save_series_persists_and_last_load_is_returned(): void
    {
        $patient                                           = $this->createPatient();
        ['plan' => $plan, 'planExercise' => $planExercise] = $this->createActiveProgram($patient);

        $start = $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/executions")
            ->assertOk();

        $executionId = $start->json('data.id');

        $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/executions/{$executionId}/series", [
                'exercise_id' => $planExercise->id,
                'series'      => [
                    ['count' => 12, 'weight_value' => '5', 'weight_unit' => 'kg', 'is_bodyweight' => false],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('data.series_count', 1);

        $detail = $this->actingAs($patient, 'patient')
            ->getJson("/api/patient/programs/{$plan->public_token}");

        $lastLoads = $detail->json('data.current_execution.last_loads');
        $this->assertSame('5', $lastLoads[(string) $planExercise->id]['weight_value'] ?? $lastLoads[$planExercise->id]['weight_value']);
    }

    public function test_update_unfinished_exercises(): void
    {
        $patient                                           = $this->createPatient();
        ['plan' => $plan, 'planExercise' => $planExercise] = $this->createActiveProgram($patient);

        $executionId = $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/executions")
            ->json('data.id');

        $this->actingAs($patient, 'patient')
            ->patchJson("/api/patient/programs/{$plan->public_token}/executions/{$executionId}", [
                'unfinished_exercise_ids' => [$planExercise->id],
            ])
            ->assertOk()
            ->assertJsonPath('data.unfinished_exercise_ids', [$planExercise->id]);
    }

    public function test_completed_program_cannot_start_execution(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $plan] = $this->createActiveProgram($patient, [
            'patient_completed_count' => 1,
        ]);

        $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/executions")
            ->assertUnprocessable();
    }

    public function test_last_load_falls_back_to_previous_completed_execution(): void
    {
        $patient                                           = $this->createPatient();
        ['plan' => $plan, 'planExercise' => $planExercise] = $this->createActiveProgram($patient);

        $oldExecution = TreatmentPlanExecution::create([
            'clinic_id'         => $plan->clinic_id,
            'treatment_plan_id' => $plan->id,
            'patient_id'        => $patient->id,
            'status'            => TreatmentPlanExecution::STATUS_COMPLETED,
            'started_at'        => now()->subDay(),
            'completed_at'      => now()->subDay(),
        ]);

        TreatmentPlanExecutionSeries::create([
            'execution_id'               => $oldExecution->id,
            'treatment_plan_exercise_id' => $planExercise->id,
            'series_index'               => 1,
            'count'                      => 10,
            'weight_value'               => '8',
            'weight_unit'                => 'kg',
            'is_bodyweight'              => false,
        ]);

        $start = $this->actingAs($patient, 'patient')
            ->postJson("/api/patient/programs/{$plan->public_token}/executions")
            ->assertOk();

        $lastLoads = $start->json('data.last_loads');
        $this->assertSame('8', $lastLoads[$planExercise->id]['weight_value']);
    }
}
