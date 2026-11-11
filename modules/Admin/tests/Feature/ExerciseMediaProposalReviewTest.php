<?php

namespace Modules\Admin\Tests\Feature;

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

class ExerciseMediaProposalReviewTest extends TestCase
{
    use RefreshDatabase;

    private const CURRENT_THUMBNAIL = 'thumbnails/videos/capa-aprovada.jpg';

    private const CURRENT_IMAGE = 'thumbnails/videos/foto-aprovada.jpg';

    private Clinic $clinicA;

    private Clinic $clinicB;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    private AdminUser $operator;

    /** @var list<string> */
    private array $deletedPaths = [];

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
        $fileService->shouldReceive('deleteFile')->andReturnUsing(function (string $path) {
            $this->deletedPaths[] = $path;

            return true;
        });
        $this->app->instance(FileServiceInterface::class, $fileService);

        $this->clinicA  = Clinic::factory()->create();
        $this->clinicB  = Clinic::factory()->create();
        $this->adminA   = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->adminB   = ClinicUser::factory()->create(['clinic_id' => $this->clinicB->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->operator = AdminUser::factory()->create();
    }

    public function test_list_shows_the_proposal_with_current_and_proposed_media(): void
    {
        $video               = $this->approvedVideoOfA();
        $exercise            = $this->approvedExerciseOfA($video);
        [$thumbnail, $image] = $this->proposeByClinicA($video);

        $response = $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/media-proposals')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.video_id', $video->id)
            ->assertJsonPath('data.0.exercise.id', $exercise->id)
            ->assertJsonPath('data.0.exercise.name', $exercise->name)
            ->assertJsonPath('data.0.exercise.review_status', Exercise::REVIEW_APPROVED)
            ->assertJsonPath('data.0.exercise.clinic.id', $this->clinicA->id)
            ->assertJsonPath('data.0.current.thumbnail_url', 'https://cdn.invalid/' . self::CURRENT_THUMBNAIL)
            ->assertJsonPath('data.0.current.reference_images.0.cdn_url', 'https://cdn.invalid/' . self::CURRENT_IMAGE)
            ->assertJsonPath('data.0.proposed.thumbnail_url', 'https://cdn.invalid/' . $thumbnail)
            ->assertJsonPath('data.0.proposed.reference_images.0.cdn_url', 'https://cdn.invalid/' . $image)
            ->assertJsonPath('data.0.proposed_at', $video->fresh()->metadata['proposed_at']);

        $this->assertNotEmpty($response->json('data.0.proposal_version'));
    }

    public function test_list_has_one_entry_per_video_and_approving_from_any_linked_exercise_updates_every_pdf(): void
    {
        $video     = $this->approvedVideoOfA();
        $pending   = $this->linkedExercise($video, $this->clinicA->id, Exercise::REVIEW_PENDING, 'PROPOSTA020 pendente ligado');
        $approved  = $this->approvedExerciseOfA($video);
        [, $image] = $this->proposeByClinicA($video);

        $orphan  = Video::factory()->create(['clinic_id' => $this->clinicA->id, 'status' => Video::STATUS_COMPLETED, 'metadata' => []]);
        $deleted = $this->linkedExercise($orphan, $this->clinicA->id, Exercise::REVIEW_APPROVED, 'PROPOSTA020 apagado');
        $this->proposeByClinicA($orphan);
        $deleted->delete();

        $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/media-proposals')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.video_id', $video->id)
            ->assertJsonPath('data.0.exercise.id', $approved->id)
            ->assertJsonPath('data.0.linked_exercises.0.id', $approved->id)
            ->assertJsonPath('data.0.linked_exercises.1.id', $pending->id)
            ->assertJsonCount(2, 'data.0.linked_exercises');

        $this->actingAs($this->operator, 'admin')
            ->putJson("/api/admin/exercises/{$pending->id}/media-proposal/approve", $this->decision($video))
            ->assertOk();

        $this->assertSame([$image], ExerciseMedia::where('exercise_id', $approved->id)->pluck('file_path')->all());
        $this->assertSame([$image], ExerciseMedia::where('exercise_id', $pending->id)->pluck('file_path')->all());
    }

    public function test_list_is_paginated_and_skips_proposals_of_videos_without_exercise(): void
    {
        $videoIds = [];
        foreach (['um', 'dois', 'tres'] as $name) {
            $video = $this->approvedVideoOfA();
            $this->approvedExerciseOfA($video, "PROPOSTA020 {$name}");
            $this->proposeByClinicA($video);
            $videoIds[] = $video->id;
        }
        $this->approvedExerciseOfA($this->approvedVideoOfA(), 'PROPOSTA020 ligado sem proposta');
        $deletedVideo = $this->approvedVideoOfA();
        $deleted      = $this->approvedExerciseOfA($deletedVideo, 'PROPOSTA020 apagado');
        $this->proposeByClinicA($deletedVideo);
        $deleted->delete();
        $this->approvedVideoOfA()->update(['metadata' => ['proposed_at' => now()->toIso8601String(), 'proposed_thumbnail_path' => 'thumbnails/videos/sem-exercicio.jpg']]);

        $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/media-proposals?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.video_id', $videoIds[0])
            ->assertJsonPath('data.1.video_id', $videoIds[1])
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 2);

        $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/media-proposals?per_page=2&page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.video_id', $videoIds[2]);

        $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/media-proposals?per_page=500')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('per_page');

        $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/media-proposals?page=9223372036854775807')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('page');
    }

    public function test_pending_count_adds_the_media_proposals(): void
    {
        $video = $this->approvedVideoOfA();
        $this->approvedExerciseOfA($video);
        $this->approvedExerciseOfA($this->approvedVideoOfA(), 'PROPOSTA020 sem proposta');
        Exercise::create([
            'name'           => 'PROPOSTA020 pendente da A',
            'physio_area_id' => PhysioArea::query()->firstOrCreate(['name' => 'Ortopedia'])->id,
            'clinic_id'      => $this->clinicA->id,
            'review_status'  => Exercise::REVIEW_PENDING,
            'is_active'      => true,
        ]);

        $this->approvedVideoOfA()->update(['metadata' => ['proposed_at' => now()->toIso8601String(), 'proposed_thumbnail_path' => 'thumbnails/videos/sem-exercicio.jpg']]);

        $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/pending-count')
            ->assertOk()
            ->assertJsonPath('data.pending_count', 1);

        $this->proposeByClinicA($video);

        $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/pending-count')
            ->assertOk()
            ->assertJsonPath('data.pending_count', 2);

        $this->actingAs($this->operator, 'admin')
            ->putJson("/api/admin/exercises/{$this->exerciseOf($video)->id}/media-proposal/approve", $this->decision($video))
            ->assertOk();

        $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/pending-count')
            ->assertOk()
            ->assertJsonPath('data.pending_count', 1);
    }

    public function test_approve_applies_the_proposal_for_every_clinic_and_the_pdf(): void
    {
        $video               = $this->approvedVideoOfA();
        $exercise            = $this->approvedExerciseOfA($video);
        [$thumbnail, $image] = $this->proposeByClinicA($video);
        $this->assertSame('https://cdn.invalid/' . self::CURRENT_THUMBNAIL, $this->listedBy($this->adminB, $exercise)['videos'][0]['thumbnail_url']);

        $this->actingAs($this->operator, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/media-proposal/approve", $this->decision($video))
            ->assertOk();

        $seenByB = $this->listedBy($this->adminB, $exercise);
        $this->assertSame('https://cdn.invalid/' . $thumbnail, $seenByB['videos'][0]['thumbnail_url']);
        $this->assertSame([$image], array_column($seenByB['videos'][0]['metadata']['reference_images'], 'file_path'));
        $this->assertSame([$image], ExerciseMedia::where('exercise_id', $exercise->id)->pluck('file_path')->all());
        $this->assertFalse($this->listedBy($this->adminA, $exercise)['media_proposal_pending']);

        $video = $video->fresh();
        $this->assertSame($thumbnail, $video->thumbnail_path);
        $this->assertSame([], array_intersect_key($video->metadata, array_flip(Video::MEDIA_PROPOSAL_KEYS)));
        $this->assertSame(Exercise::REVIEW_APPROVED, $exercise->fresh()->review_status);
        $this->assertSame([], $this->deletedPaths);
    }

    public function test_reject_keeps_current_media_and_deletes_only_the_proposed_objects(): void
    {
        $video               = $this->approvedVideoOfA();
        $exercise            = $this->approvedExerciseOfA($video);
        [$thumbnail, $image] = $this->proposeByClinicA($video, keepCurrentImage: true);
        $metadataBefore      = $video->fresh()->metadata;

        $this->actingAs($this->operator, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/media-proposal/reject", $this->decision($video))
            ->assertOk();

        $this->assertEqualsCanonicalizing([$thumbnail, $image], $this->deletedPaths);

        $video = $video->fresh();
        $this->assertSame(self::CURRENT_THUMBNAIL, $video->thumbnail_path);
        $this->assertSame($metadataBefore['reference_images'], $video->metadata['reference_images']);
        $this->assertSame([], array_intersect_key($video->metadata, array_flip(Video::MEDIA_PROPOSAL_KEYS)));
        $this->assertSame([self::CURRENT_IMAGE], ExerciseMedia::where('exercise_id', $exercise->id)->pluck('file_path')->all());
        $this->assertSame(Exercise::REVIEW_APPROVED, $exercise->fresh()->review_status);

        $seenByB = $this->listedBy($this->adminB, $exercise);
        $this->assertSame('https://cdn.invalid/' . self::CURRENT_THUMBNAIL, $seenByB['videos'][0]['thumbnail_url']);
        $this->assertFalse($this->listedBy($this->adminA, $exercise)['media_proposal_pending']);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function decisions(): array
    {
        return ['aprovar' => ['approve'], 'rejeitar' => ['reject']];
    }

    #[DataProvider('decisions')]
    public function test_decision_without_proposal_is_unprocessable(string $decision): void
    {
        $video    = $this->approvedVideoOfA();
        $exercise = $this->approvedExerciseOfA($video);
        $before   = $video->fresh()->getAttributes();

        $this->actingAs($this->operator, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/media-proposal/{$decision}", ['video_id' => $video->id, 'proposal_version' => str_repeat('a', 64)])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Este exercício não tem proposta de mídia esperando revisão.');

        $this->assertEquals($before, $video->fresh()->getAttributes());
        $this->assertSame([], $this->deletedPaths);
    }

    #[DataProvider('decisions')]
    public function test_decision_with_video_not_linked_to_the_exercise_is_unprocessable_and_keeps_the_proposal(string $decision): void
    {
        $video = $this->approvedVideoOfA();
        $this->approvedExerciseOfA($video);
        $this->proposeByClinicA($video);
        $otherExercise = $this->approvedExerciseOfA($this->approvedVideoOfA(), 'PROPOSTA020 outro aprovado');
        $before        = $video->fresh()->getAttributes();

        $this->actingAs($this->operator, 'admin')
            ->putJson("/api/admin/exercises/{$otherExercise->id}/media-proposal/{$decision}", $this->decision($video))
            ->assertUnprocessable();

        $this->assertEquals($before, $video->fresh()->getAttributes());
        $this->assertSame([], $this->deletedPaths);
    }

    #[DataProvider('decisions')]
    public function test_decision_on_a_proposal_changed_after_the_review_opened_is_a_conflict_and_changes_nothing(string $decision): void
    {
        $video    = $this->approvedVideoOfA();
        $exercise = $this->approvedExerciseOfA($video);
        $this->proposeByClinicA($video);
        $seenByOperator = $this->decision($video);

        $newer = $this->issuedPath($video);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$newer]])
            ->assertOk();
        $before        = $video->fresh()->getAttributes();
        $deletedBefore = $this->deletedPaths;

        $this->actingAs($this->operator, 'admin')
            ->putJson("/api/admin/exercises/{$exercise->id}/media-proposal/{$decision}", $seenByOperator)
            ->assertStatus(409)
            ->assertJsonPath('message', 'A proposta mudou desde que a revisão foi aberta. Recarregue a lista e confira a mídia nova.');

        $this->assertEquals($before, $video->fresh()->getAttributes());
        $this->assertSame($deletedBefore, $this->deletedPaths);
        $this->assertSame([self::CURRENT_IMAGE], ExerciseMedia::where('exercise_id', $exercise->id)->pluck('file_path')->all());
    }

    public function test_clinic_users_get_401_on_every_review_route_and_nothing_changes(): void
    {
        $video    = $this->approvedVideoOfA();
        $exercise = $this->approvedExerciseOfA($video);
        $this->proposeByClinicA($video);
        $decision = $this->decision($video);
        $before   = $video->fresh()->getAttributes();

        foreach ([$this->adminB, $this->adminA] as $clinicUser) {
            $token = auth('clinic')->login($clinicUser);

            $this->asClinicBearer($token)
                ->getJson('/api/admin/exercises/media-proposals')
                ->assertUnauthorized();
            $this->asClinicBearer($token)
                ->putJson("/api/admin/exercises/{$exercise->id}/media-proposal/approve", $decision)
                ->assertUnauthorized();
            $this->asClinicBearer($token)
                ->putJson("/api/admin/exercises/{$exercise->id}/media-proposal/reject", $decision)
                ->assertUnauthorized();
        }
        $this->forgetSession();

        $this->assertEquals($before, $video->fresh()->getAttributes());
        $this->assertSame([], $this->deletedPaths);
        $this->assertSame('https://cdn.invalid/' . self::CURRENT_THUMBNAIL, $this->listedBy($this->adminB, $exercise)['videos'][0]['thumbnail_url']);
    }

    #[DataProvider('decisions')]
    public function test_decision_on_missing_exercise_is_not_found(string $decision): void
    {
        $video = $this->approvedVideoOfA();
        $this->approvedExerciseOfA($video);
        $this->proposeByClinicA($video);

        $this->actingAs($this->operator, 'admin')
            ->putJson("/api/admin/exercises/999999/media-proposal/{$decision}", $this->decision($video))
            ->assertNotFound();

        $this->assertArrayHasKey('proposed_at', $video->fresh()->metadata);
    }

    private function approvedVideoOfA(): Video
    {
        return Video::factory()->create([
            'clinic_id'      => $this->clinicA->id,
            'status'         => Video::STATUS_COMPLETED,
            'thumbnail_path' => self::CURRENT_THUMBNAIL,
            'thumbnail_url'  => 'https://cdn.invalid/' . self::CURRENT_THUMBNAIL,
            'metadata'       => [
                'reference_images' => [[
                    'file_path'         => self::CURRENT_IMAGE,
                    'cdn_url'           => 'https://cdn.invalid/' . self::CURRENT_IMAGE,
                    'original_filename' => basename(self::CURRENT_IMAGE),
                    'mime_type'         => 'image/jpeg',
                    'size'              => 0,
                ]],
            ],
        ]);
    }

    private function approvedExerciseOfA(Video $video, string $name = 'PROPOSTA020 aprovado da A'): Exercise
    {
        $exercise = Exercise::create([
            'name'           => $name,
            'physio_area_id' => PhysioArea::query()->firstOrCreate(['name' => 'Ortopedia'])->id,
            'clinic_id'      => $this->clinicA->id,
            'review_status'  => Exercise::REVIEW_APPROVED,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);
        ExerciseMedia::create([
            'exercise_id'       => $exercise->id,
            'type'              => ExerciseMedia::TYPE_IMAGE,
            'file_path'         => self::CURRENT_IMAGE,
            'cdn_url'           => 'https://cdn.invalid/' . self::CURRENT_IMAGE,
            'original_filename' => basename(self::CURRENT_IMAGE),
            'mime_type'         => 'image/jpeg',
            'size'              => 0,
            'sort_order'        => 0,
        ]);

        return $exercise;
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function proposeByClinicA(Video $video, bool $keepCurrentImage = false): array
    {
        $thumbnail = $this->issuedPath($video);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $thumbnail])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true);

        $image = $this->issuedPath($video);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => $keepCurrentImage ? [$image, self::CURRENT_IMAGE] : [$image]])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true);

        return [$thumbnail, $image];
    }

    private function linkedExercise(Video $video, ?int $clinicId, string $reviewStatus, string $name): Exercise
    {
        $exercise = Exercise::create([
            'name'           => $name,
            'physio_area_id' => PhysioArea::query()->firstOrCreate(['name' => 'Ortopedia'])->id,
            'clinic_id'      => $clinicId,
            'review_status'  => $reviewStatus,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        return $exercise;
    }

    private function exerciseOf(Video $video): Exercise
    {
        return Exercise::query()->whereHas('videos', fn ($query) => $query->whereKey($video->id))->firstOrFail();
    }

    /**
     * @return array{video_id: int, proposal_version: string}
     */
    private function decision(Video $video): array
    {
        $proposals = $this->actingAs($this->operator, 'admin')
            ->getJson('/api/admin/exercises/media-proposals')
            ->assertOk()
            ->json('data');
        $proposal = collect($proposals)->firstWhere('video_id', $video->id);

        return ['video_id' => $video->id, 'proposal_version' => $proposal['proposal_version']];
    }

    /**
     * @return array<string, mixed>
     */
    private function listedBy(ClinicUser $user, Exercise $exercise): array
    {
        $rows = $this->actingAs($user, 'clinic')
            ->getJson('/api/clinic/exercises?search=' . urlencode($exercise->name))
            ->assertOk()
            ->json('data.data');
        $this->assertCount(1, $rows);

        return $rows[0];
    }

    private function asClinicBearer(string $token): static
    {
        $this->forgetSession();

        return $this->withToken($token);
    }

    private function forgetSession(): void
    {
        $this->app['auth']->forgetGuards();
        $this->app['tymon.jwt']->unsetToken();
        $this->withHeaders(['Authorization' => '']);
    }

    private function issuedPath(Video $video): string
    {
        return $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/presigned-thumbnail-replace-request", [
                'filename' => 'nova.jpg', 'mime_type' => 'image/jpeg', 'size' => 1024,
            ])
            ->assertOk()
            ->json('data.path');
    }
}
