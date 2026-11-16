<?php

namespace Modules\Media\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\ExerciseMedia;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Models\Video;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ApprovedExerciseMediaProposalTest extends TestCase
{
    use RefreshDatabase;

    private Clinic $clinicA;

    private Clinic $clinicB;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        $fileService = Mockery::mock(FileServiceInterface::class);
        $fileService->shouldReceive('createPresignedUploadUrl')->andReturnUsing(fn (string $path) => [
            'upload_url' => 'https://r2.invalid/put/' . $path,
            'path'       => $path,
            'expires_at' => now()->addMinutes(15)->toISOString(),
        ]);
        $fileService->shouldReceive('fileExists')->andReturnTrue();
        $fileService->shouldReceive('getFileUrl')->andReturnUsing(fn (string $path) => 'https://r2.invalid/' . $path);
        $fileService->shouldReceive('getFileCdnUrl')->andReturnUsing(fn (string $path) => 'https://cdn.invalid/' . $path);
        $fileService->shouldReceive('deleteFile')->andReturnTrue();
        $this->app->instance(FileServiceInterface::class, $fileService);

        $this->clinicA = Clinic::factory()->create();
        $this->clinicB = Clinic::factory()->create();
        $this->adminA  = $this->clinicAdmin($this->clinicA);
        $this->adminB  = $this->clinicAdmin($this->clinicB);
    }

    public function test_owner_reference_images_on_approved_exercise_become_a_proposal_and_other_clinic_keeps_old_ones(): void
    {
        $video      = $this->completedVideoOfA();
        $exerciseId = $this->submitAndApprove($video);

        $path = $this->requestReplacePath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertOk()
            ->assertJsonPath('data.id', $video->id)
            ->assertJsonPath('data.proposal_pending', true);

        $seenByB = $this->seenByClinicB();
        $this->assertSame([], $seenByB['videos'][0]['metadata']['reference_images'] ?? []);
        $this->assertSame(0, ExerciseMedia::where('exercise_id', $exerciseId)->count());

        $metadata = $video->fresh()->metadata;
        $this->assertArrayNotHasKey('reference_images', $metadata);
        $this->assertSame([$path], array_column($metadata['proposed_reference_images'], 'file_path'));
        $this->assertSame($this->adminA->id, $metadata['proposed_by_clinic_user_id']);
        $this->assertNotEmpty($metadata['proposed_at']);
    }

    public function test_operator_cannot_reject_approved_exercise_to_unlock_its_video(): void
    {
        $video      = $this->completedVideoOfA();
        $exerciseId = $this->submitAndApprove($video);

        $this->actingAs(AdminUser::factory()->create(), 'admin')
            ->putJson("/api/admin/exercises/{$exerciseId}/reject")
            ->assertUnprocessable();

        $path = $this->requestReplacePath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true);

        $this->assertSame([], $this->seenByClinicB()['videos'][0]['metadata']['reference_images'] ?? []);
        $this->assertSame(0, ExerciseMedia::where('exercise_id', $exerciseId)->count());
    }

    public function test_other_clinic_does_not_receive_the_proposal_in_the_video_metadata(): void
    {
        $video = $this->completedVideoOfA();
        $this->submitAndApprove($video);
        $path = $this->requestReplacePath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertOk();

        $metadataSeenByB = $this->seenByClinicB()['videos'][0]['metadata'] ?? [];
        foreach (['proposed_thumbnail_path', 'proposed_reference_images', 'proposed_at', 'proposed_by_clinic_user_id'] as $key) {
            $this->assertArrayNotHasKey($key, $metadataSeenByB);
        }
        $this->assertStringNotContainsString($path, json_encode($this->seenByClinicB(), JSON_UNESCAPED_SLASHES));
    }

    public function test_thumbnail_confirmed_after_approval_of_pending_video_becomes_a_proposal_and_other_clinic_keeps_old_one(): void
    {
        $video = Video::factory()->create([
            'clinic_id'      => $this->clinicA->id,
            'status'         => Video::STATUS_PENDING,
            'thumbnail_path' => null,
            'thumbnail_url'  => null,
            'metadata'       => [],
        ]);
        $this->submitAndApprove($video);
        $this->assertNull($this->seenByClinicB()['videos'][0]['thumbnail_url']);

        $thumbnail = $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/presigned-thumbnail-request", [
                'filename' => 'capa.jpg', 'mime_type' => 'image/jpeg', 'size' => 1024,
            ])
            ->assertOk()
            ->json('data.path');

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/confirm-upload", ['thumbnail_path' => $thumbnail])
            ->assertOk()
            ->assertJsonPath('data.status', Video::STATUS_COMPLETED)
            ->assertJsonPath('data.thumbnail_url', null)
            ->assertJsonPath('data.proposal_pending', true);

        $this->assertNull($this->seenByClinicB()['videos'][0]['thumbnail_url']);

        $video = $video->fresh();
        $this->assertSame(Video::STATUS_COMPLETED, $video->status);
        $this->assertNull($video->thumbnail_path);
        $this->assertSame($thumbnail, $video->metadata['proposed_thumbnail_path']);
        $this->assertSame($this->adminA->id, $video->metadata['proposed_by_clinic_user_id']);
        $this->assertArrayNotHasKey('pending_thumbnail_path', $video->metadata);
    }

    public function test_second_proposal_replaces_the_first_one(): void
    {
        $video = $this->completedVideoOfA();
        $this->submitAndApprove($video);
        $first  = $this->requestReplacePath($video);
        $second = $this->requestReplacePath($video);
        $start  = now()->startOfSecond();

        $this->travelTo($start);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$first]])
            ->assertOk();

        $otherAdminA = $this->clinicAdmin($this->clinicA);
        $this->travelTo($start->copy()->addMinutes(5));
        $this->actingAs($otherAdminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$second]])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true);

        $metadata = $video->fresh()->metadata;
        $this->assertSame([$second], array_column($metadata['proposed_reference_images'], 'file_path'));
        $this->assertSame($otherAdminA->id, $metadata['proposed_by_clinic_user_id']);
        $this->assertSame($start->copy()->addMinutes(5)->toIso8601String(), $metadata['proposed_at']);
    }

    public function test_reference_images_proposal_keeps_the_thumbnail_proposed_before(): void
    {
        $video = Video::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'status'    => Video::STATUS_PENDING,
            'metadata'  => [],
        ]);
        $this->submitAndApprove($video);

        $thumbnail = $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/presigned-thumbnail-request", [
                'filename' => 'capa.jpg', 'mime_type' => 'image/jpeg', 'size' => 1024,
            ])
            ->json('data.path');
        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/confirm-upload", ['thumbnail_path' => $thumbnail])
            ->assertOk();

        $path = $this->requestReplacePath($video);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertOk();

        $metadata = $video->fresh()->metadata;
        $this->assertSame($thumbnail, $metadata['proposed_thumbnail_path']);
        $this->assertSame([$path], array_column($metadata['proposed_reference_images'], 'file_path'));
    }

    public function test_not_approved_exercise_video_applies_reference_images_and_thumbnail_right_away(): void
    {
        $video = Video::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'status'    => Video::STATUS_PENDING,
            'metadata'  => [],
        ]);
        $exercise = $this->linkedExercise($video, $this->clinicA->id, Exercise::REVIEW_PENDING);

        $thumbnail = $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/presigned-thumbnail-request", [
                'filename' => 'capa.jpg', 'mime_type' => 'image/jpeg', 'size' => 1024,
            ])
            ->json('data.path');
        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/confirm-upload", ['thumbnail_path' => $thumbnail])
            ->assertOk()
            ->assertJsonPath('data.thumbnail_url', 'https://cdn.invalid/' . $thumbnail)
            ->assertJsonPath('data.proposal_pending', false);

        $path = $this->requestReplacePath($video);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertOk()
            ->assertJsonPath('data.metadata.reference_images.0.file_path', $path)
            ->assertJsonPath('data.proposal_pending', false);

        $video = $video->fresh();
        $this->assertSame($thumbnail, $video->thumbnail_path);
        $this->assertSame([], array_intersect_key($video->metadata, array_flip(Video::MEDIA_PROPOSAL_KEYS)));
        $this->assertSame([$path], ExerciseMedia::where('exercise_id', $exercise->id)->pluck('file_path')->all());
    }

    /**
     * @return array<string, array{?string, string, bool}>
     */
    public static function linkedExercises(): array
    {
        return [
            'aprovado da dona'       => ['dona', Exercise::REVIEW_APPROVED, true],
            'global'                 => [null, Exercise::REVIEW_PENDING, true],
            'pendente de outra'      => ['outra', Exercise::REVIEW_PENDING, true],
            'pendente da dona'       => ['dona', Exercise::REVIEW_PENDING, false],
            'rejeitado da dona'      => ['dona', Exercise::REVIEW_REJECTED, false],
        ];
    }

    #[DataProvider('linkedExercises')]
    public function test_video_is_locked_when_linked_to_exercise_beyond_owner_review(?string $exerciseClinic, string $reviewStatus, bool $locked): void
    {
        $video    = $this->completedVideoOfA();
        $clinicId = match ($exerciseClinic) {
            'dona'  => $this->clinicA->id,
            'outra' => $this->clinicB->id,
            default => null,
        };
        $this->linkedExercise($video, $this->clinicA->id, Exercise::REVIEW_PENDING);
        $this->linkedExercise($video, $clinicId, $reviewStatus);
        $path = $this->requestReplacePath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', $locked);

        $metadata = $video->fresh()->metadata;
        $this->assertSame($locked, array_key_exists('proposed_reference_images', $metadata));
        $this->assertSame(!$locked, array_key_exists('reference_images', $metadata));
    }

    public function test_video_without_exercise_applies_right_away(): void
    {
        $video = $this->completedVideoOfA();
        $path  = $this->requestReplacePath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', false);

        $this->assertSame([$path], array_column($video->fresh()->metadata['reference_images'], 'file_path'));
    }

    public function test_other_clinic_gets_404_on_every_media_route_of_the_locked_video_and_nothing_changes(): void
    {
        $video = $this->completedVideoOfA();
        $this->submitAndApprove($video);
        $path = $this->requestReplacePath($video);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertOk();
        $before = $video->fresh()->getAttributes();

        $image = ['filename' => 'b.jpg', 'mime_type' => 'image/jpeg', 'size' => 1024];
        $this->actingAs($this->adminB, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/presigned-thumbnail-request", $image)
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/presigned-thumbnail-replace-request", $image)
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/confirm-upload", ['thumbnail_path' => $path])
            ->assertNotFound();
        $this->actingAs($this->adminB, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertNotFound();

        $this->assertEquals($before, $video->fresh()->getAttributes());
    }

    public function test_physiotherapist_of_owner_clinic_cannot_propose_media(): void
    {
        $video = $this->completedVideoOfA();
        $this->submitAndApprove($video);
        $path   = $this->requestReplacePath($video);
        $physio = ClinicUser::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        $this->actingAs($physio, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$path]])
            ->assertForbidden();

        $this->assertArrayNotHasKey('proposed_at', $video->fresh()->metadata);
    }

    private function linkedExercise(Video $video, ?int $clinicId, string $reviewStatus): Exercise
    {
        $exercise = Exercise::create([
            'name'           => 'Ligado ' . $reviewStatus,
            'physio_area_id' => PhysioArea::query()->firstOrCreate(['name' => 'Área ligada'])->id,
            'clinic_id'      => $clinicId,
            'review_status'  => $reviewStatus,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        return $exercise;
    }

    private function clinicAdmin(Clinic $clinic): ClinicUser
    {
        return ClinicUser::factory()->create(['clinic_id' => $clinic->id, 'role' => ClinicUser::ROLE_ADMIN]);
    }

    private function completedVideoOfA(): Video
    {
        return Video::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => [],
        ]);
    }

    private function submitAndApprove(Video $video): int
    {
        $area = PhysioArea::query()->create(['name' => 'Área da proposta']);

        $exerciseId = $this->actingAs($this->adminA, 'clinic')->postJson('/api/clinic/exercises', [
            'name'             => 'PROPOSTA exercicio da clinica A',
            'physio_area_id'   => $area->id,
            'difficulty_level' => array_key_first(Exercise::DIFFICULTIES),
            'video_id'         => $video->id,
        ])->assertCreated()->json('data.id');

        $this->actingAs(AdminUser::factory()->create(), 'admin')
            ->putJson("/api/admin/exercises/{$exerciseId}/approve")
            ->assertOk();

        return (int) $exerciseId;
    }

    private function requestReplacePath(Video $video): string
    {
        return $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/presigned-thumbnail-replace-request", [
                'filename' => 'nova.jpg', 'mime_type' => 'image/jpeg', 'size' => 1024,
            ])
            ->assertOk()
            ->json('data.path');
    }

    /**
     * @return array<string, mixed>
     */
    private function seenByClinicB(): array
    {
        $rows = $this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/exercises?search=PROPOSTA')
            ->assertOk()
            ->json('data.data');

        $this->assertCount(1, $rows);

        return $rows[0];
    }
}
