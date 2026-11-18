<?php

namespace Modules\TreatmentProgram\Tests\Feature\Patient;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Modules\Clinic\Models\ClinicUser;
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
            ->assertJsonPath('data.groups.0.exercises.0.id', $planExercise->id);
        $this->assertSignedVideoUrl($response->json('data.groups.0.exercises.0.video_url'), 'videos/programa.mp4');
        $this->assertSignedVideoUrl($response->json('data.groups.0.exercises.0.thumbnail_url'), 'covers/videos/programa.jpg');
    }

    public function test_public_detail_does_not_include_another_programs_video(): void
    {
        $patient                                           = $this->createPatient();
        ['plan' => $first]                                 = $this->createActiveProgram($patient);
        ['plan' => $second, 'exercise' => $secondExercise] = $this->createActiveProgram($patient);
        $secondExercise->videos()->first()->update([
            'path' => 'videos/outro-programa.mp4',
        ]);

        $response = $this->getJson("/api/patient/programs/{$first->public_token}");

        $response->assertOk();
        $this->assertSignedVideoUrl(
            $response->json('data.groups.0.exercises.0.video_url'),
            'videos/programa.mp4',
        );
        $this->assertStringNotContainsString('videos/outro-programa.mp4', $response->getContent());
        $this->assertStringNotContainsString($second->public_token, $response->getContent());
    }

    public function test_public_detail_does_not_include_media_of_a_patient_from_another_clinic(): void
    {
        $patient          = $this->createPatient();
        ['plan' => $mine] = $this->createActiveProgram($patient);

        $otherUser    = ClinicUser::factory()->create();
        $otherPatient = $this->createPatient(['clinic_id' => $otherUser->clinic_id]);
        [
            'plan'     => $theirs,
            'exercise' => $theirExercise,
        ] = $this->createActiveProgram($otherPatient, [
            'clinic_id'      => $otherUser->clinic_id,
            'clinic_user_id' => $otherUser->id,
        ]);
        $theirExercise->videos()->first()->update([
            'path'           => 'videos/de-outra-clinica.mp4',
            'thumbnail_path' => 'covers/videos/de-outra-clinica.jpg',
        ]);

        $response = $this->getJson("/api/patient/programs/{$mine->public_token}");

        $response->assertOk();
        $this->assertStringNotContainsString('de-outra-clinica', $response->getContent());
        $this->assertStringNotContainsString($theirs->public_token, $response->getContent());
        $this->assertStringNotContainsString($otherPatient->name, $response->getContent());

        $this->assertStringNotContainsString(
            'videos/programa.mp4',
            $this->getJson("/api/patient/programs/{$theirs->public_token}")->assertOk()->getContent(),
        );
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
