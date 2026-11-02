<?php

namespace Modules\Clinic\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Models\Video;
use Tests\TestCase;

class ExerciseSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private PhysioArea $physioArea;

    protected function setUp(): void
    {
        parent::setUp();
        $this->physioArea = PhysioArea::create(['name' => 'Ortopedia']);
    }

    private function clinicAdmin(?Clinic $clinic = null): ClinicUser
    {
        return ClinicUser::factory()->create([
            'clinic_id' => ($clinic ?? Clinic::factory()->create())->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
    }

    private function payload(array $overrides = [], ?int $clinicId = null): array
    {
        $video = Video::factory()->create([
            'clinic_id' => $clinicId,
            'status'    => Video::STATUS_COMPLETED,
        ]);

        return array_merge([
            'name'             => 'Ponte Glútea',
            'physio_area_id'   => $this->physioArea->id,
            'difficulty_level' => Exercise::DIFFICULTY_EASY,
            'description'      => 'Descrição',
            'video_id'         => $video->id,
        ], $overrides);
    }

    public function test_clinic_admin_can_submit_exercise_as_pending(): void
    {
        $admin = $this->clinicAdmin();

        $response = $this->actingAs($admin, 'clinic')
            ->postJson('/api/clinic/exercises', $this->payload([], $admin->clinic_id));

        $response->assertCreated()
            ->assertJsonPath('data.review_status', Exercise::REVIEW_PENDING)
            ->assertJsonPath('data.is_own_submission', true);

        $this->assertDatabaseHas('admin_exercises', [
            'name'          => 'Ponte Glútea',
            'clinic_id'     => $admin->clinic_id,
            'review_status' => Exercise::REVIEW_PENDING,
        ]);
    }

    public function test_pending_exercise_is_not_visible_to_other_clinic(): void
    {
        $author = $this->clinicAdmin();
        $this->actingAs($author, 'clinic')
            ->postJson('/api/clinic/exercises', $this->payload(['name' => 'Privado A'], $author->clinic_id))
            ->assertCreated();

        $otherClinicUser = $this->clinicAdmin();

        $ids = collect(
            $this->actingAs($otherClinicUser, 'clinic')
                ->getJson('/api/clinic/exercises')
                ->assertOk()
                ->json('data.data')
        )->pluck('name');

        $this->assertFalse($ids->contains('Privado A'));
    }

    public function test_non_admin_clinic_user_cannot_submit(): void
    {
        $clinic = Clinic::factory()->create();
        $physio = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        $this->actingAs($physio, 'clinic')
            ->postJson('/api/clinic/exercises', $this->payload([], $clinic->id))
            ->assertForbidden();
    }

    public function test_submit_requires_valid_video(): void
    {
        $admin = $this->clinicAdmin();

        $this->actingAs($admin, 'clinic')
            ->postJson('/api/clinic/exercises', $this->payload(['video_id' => 999999], $admin->clinic_id))
            ->assertStatus(422);
    }

    public function test_submit_rejects_video_from_other_clinic_or_catalog(): void
    {
        $clinicA      = Clinic::factory()->create();
        $clinicB      = Clinic::factory()->create();
        $adminB       = $this->clinicAdmin($clinicB);
        $videoOfA     = Video::factory()->create([
            'clinic_id' => $clinicA->id,
            'status'    => Video::STATUS_COMPLETED,
        ]);
        $catalogVideo = Video::factory()->create([
            'clinic_id' => null,
            'status'    => Video::STATUS_COMPLETED,
        ]);

        $this->actingAs($adminB, 'clinic')
            ->postJson('/api/clinic/exercises', $this->payload(['video_id' => $videoOfA->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['video_id']);

        $this->actingAs($adminB, 'clinic')
            ->postJson('/api/clinic/exercises', $this->payload(['video_id' => $catalogVideo->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['video_id']);
    }

    public function test_approved_exercise_becomes_visible_to_all_clinics(): void
    {
        $author   = $this->clinicAdmin();
        $exercise = $this->actingAs($author, 'clinic')
            ->postJson('/api/clinic/exercises', $this->payload(['name' => 'Compartilhado'], $author->clinic_id))
            ->json('data.id');

        $exerciseModel = Exercise::find($exercise);
        $exerciseModel->update(['review_status' => Exercise::REVIEW_APPROVED]);

        $otherClinicUser = $this->clinicAdmin();
        $names           = collect(
            $this->actingAs($otherClinicUser, 'clinic')
                ->getJson('/api/clinic/exercises')
                ->json('data.data')
        )->pluck('name');

        $this->assertTrue($names->contains('Compartilhado'));
    }
}
