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

    public function test_other_clinic_receives_no_media_link_of_a_pending_exercise(): void
    {
        $author  = $this->clinicAdmin();
        $payload = $this->payload(['name' => 'Privado A'], $author->clinic_id);
        Video::whereKey($payload['video_id'])->update([
            'path'           => 'videos/privado-da-clinica-a.mp4',
            'thumbnail_path' => 'covers/videos/privado-da-clinica-a.jpg',
        ]);
        $this->actingAs($author, 'clinic')->postJson('/api/clinic/exercises', $payload)->assertCreated();
        $this->assertStringContainsString(
            'privado-da-clinica-a',
            $this->actingAs($author, 'clinic')->getJson('/api/clinic/exercises')->assertOk()->getContent(),
        );

        $otherClinicUser = $this->clinicAdmin();
        $body            = $this->actingAs($otherClinicUser, 'clinic')
            ->getJson('/api/clinic/exercises')
            ->assertOk()
            ->getContent();

        $this->assertStringNotContainsString('privado-da-clinica-a', $body);
    }

    public function test_show_returns_own_pending_exercise_with_a_fresh_signed_video_link(): void
    {
        $author  = $this->clinicAdmin();
        $payload = $this->payload(['name' => 'Pendente A'], $author->clinic_id);
        Video::whereKey($payload['video_id'])->update(['path' => 'videos/pendente-a.mp4']);
        $id = $this->actingAs($author, 'clinic')->postJson('/api/clinic/exercises', $payload)->assertCreated()->json('data.id');

        $response = $this->actingAs($author, 'clinic')->getJson("/api/clinic/exercises/{$id}")->assertOk();

        $response->assertJsonPath('data.id', $id)->assertJsonPath('data.is_own_submission', true);
        $this->assertSignedVideoUrl($response->json('data.videos.0.video_url'), 'videos/pendente-a.mp4');
        $this->assertArrayNotHasKey('clinic_id', $response->json('data'));
    }

    public function test_show_hides_a_pending_exercise_of_another_clinic(): void
    {
        $author  = $this->clinicAdmin();
        $payload = $this->payload(['name' => 'Pendente A'], $author->clinic_id);
        Video::whereKey($payload['video_id'])->update(['path' => 'videos/pendente-a.mp4']);
        $id = $this->actingAs($author, 'clinic')->postJson('/api/clinic/exercises', $payload)->assertCreated()->json('data.id');

        $response = $this->actingAs($this->clinicAdmin(), 'clinic')->getJson("/api/clinic/exercises/{$id}");

        $response->assertNotFound();
        $this->assertStringNotContainsString('pendente-a', $response->getContent());
    }

    public function test_show_returns_an_approved_catalog_exercise(): void
    {
        $exercise = Exercise::create([
            'name'           => 'Catálogo Global',
            'physio_area_id' => $this->physioArea->id,
            'review_status'  => Exercise::REVIEW_APPROVED,
            'is_active'      => true,
        ]);

        $this->actingAs($this->clinicAdmin(), 'clinic')
            ->getJson("/api/clinic/exercises/{$exercise->id}")
            ->assertOk()
            ->assertJsonPath('data.name', 'Catálogo Global')
            ->assertJsonPath('data.is_own_submission', false);
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
