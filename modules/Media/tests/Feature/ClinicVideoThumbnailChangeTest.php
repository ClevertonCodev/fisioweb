<?php

namespace Modules\Media\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Mockery\MockInterface;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Models\Video;
use Tests\TestCase;

class ClinicVideoThumbnailChangeTest extends TestCase
{
    use RefreshDatabase;

    private const OLD_THUMBNAIL = 'thumbnails/videos/antiga.jpg';

    private MockInterface $fileService;

    private Clinic $clinicA;

    private Clinic $clinicB;

    private ClinicUser $adminA;

    private ClinicUser $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fileService = Mockery::mock(FileServiceInterface::class);
        $this->fileService->shouldReceive('createPresignedUploadUrl')->andReturnUsing(fn (string $path) => [
            'upload_url' => 'https://r2.invalid/put/' . $path,
            'path'       => $path,
            'expires_at' => now()->addMinutes(15)->toISOString(),
        ]);
        $this->fileService->shouldReceive('getFileCdnUrl')->andReturnUsing(fn (string $path) => 'https://cdn.invalid/' . $path);
        $this->app->instance(FileServiceInterface::class, $this->fileService);

        $this->clinicA = Clinic::factory()->create();
        $this->clinicB = Clinic::factory()->create();
        $this->adminA  = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_ADMIN]);
        $this->adminB  = ClinicUser::factory()->create(['clinic_id' => $this->clinicB->id, 'role' => ClinicUser::ROLE_ADMIN]);
    }

    public function test_owner_changes_thumbnail_of_free_video_right_away(): void
    {
        $this->fileService->shouldReceive('fileExists')->andReturnTrue();
        $video = $this->videoOfA(Exercise::REVIEW_PENDING);
        $path  = $this->issuedPath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $path])
            ->assertOk()
            ->assertJsonPath('data.id', $video->id)
            ->assertJsonPath('data.thumbnail_url', 'https://cdn.invalid/' . $path)
            ->assertJsonPath('data.proposal_pending', false);

        $video = $video->fresh();
        $this->assertSame($path, $video->thumbnail_path);
        $this->assertSame('https://cdn.invalid/' . $path, $video->thumbnail_url);
        $this->assertSame([], array_intersect_key($video->metadata, array_flip(Video::MEDIA_PROPOSAL_KEYS)));
    }

    public function test_owner_thumbnail_on_locked_video_becomes_a_proposal_and_other_clinic_keeps_old_one(): void
    {
        $this->fileService->shouldReceive('fileExists')->andReturnTrue();
        $video = $this->videoOfA(Exercise::REVIEW_APPROVED);
        $path  = $this->issuedPath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $path])
            ->assertOk()
            ->assertJsonPath('data.thumbnail_url', 'https://cdn.invalid/' . self::OLD_THUMBNAIL)
            ->assertJsonPath('data.proposal_pending', true);

        $video = $video->fresh();
        $this->assertSame(self::OLD_THUMBNAIL, $video->thumbnail_path);
        $this->assertSame($path, $video->metadata['proposed_thumbnail_path']);
        $this->assertSame($this->adminA->id, $video->metadata['proposed_by_clinic_user_id']);
        $this->assertNotEmpty($video->metadata['proposed_at']);

        $responseToB = $this->actingAs($this->adminB, 'clinic')
            ->getJson('/api/clinic/exercises?search=CAPA')
            ->assertOk();
        $this->assertSame('https://cdn.invalid/' . self::OLD_THUMBNAIL, $responseToB->json('data.data.0.videos.0.thumbnail_url'));
        $this->assertStringNotContainsString($path, json_encode($responseToB->json(), JSON_UNESCAPED_SLASHES));
    }

    public function test_thumbnail_proposal_keeps_the_reference_images_proposed_before(): void
    {
        $this->fileService->shouldReceive('fileExists')->andReturnTrue();
        $video     = $this->videoOfA(Exercise::REVIEW_APPROVED);
        $image     = $this->issuedPath($video);
        $thumbnail = $this->issuedPath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$image]])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $thumbnail])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true);

        $metadata = $video->fresh()->metadata;
        $this->assertSame($thumbnail, $metadata['proposed_thumbnail_path']);
        $this->assertSame([$image], array_column($metadata['proposed_reference_images'], 'file_path'));
    }

    public function test_other_clinic_gets_404_and_nothing_changes(): void
    {
        $this->fileService->shouldReceive('fileExists')->andReturnTrue();
        $video  = $this->videoOfA(Exercise::REVIEW_PENDING);
        $path   = $this->issuedPath($video);
        $before = $video->fresh()->getAttributes();

        $this->actingAs($this->adminB, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $path])
            ->assertNotFound();

        $this->assertEquals($before, $video->fresh()->getAttributes());
    }

    public function test_physiotherapist_of_owner_clinic_gets_403_and_nothing_changes(): void
    {
        $this->fileService->shouldReceive('fileExists')->andReturnTrue();
        $video  = $this->videoOfA(Exercise::REVIEW_PENDING);
        $path   = $this->issuedPath($video);
        $before = $video->fresh()->getAttributes();
        $physio = ClinicUser::factory()->create([
            'clinic_id' => $this->clinicA->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        $this->actingAs($physio, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $path])
            ->assertForbidden();

        $this->assertEquals($before, $video->fresh()->getAttributes());
    }

    public function test_path_not_issued_for_the_video_gets_422_and_nothing_changes(): void
    {
        $this->fileService->shouldReceive('fileExists')->andReturnTrue();
        $video      = $this->videoOfA(Exercise::REVIEW_PENDING);
        $otherVideo = $this->videoOfA(Exercise::REVIEW_PENDING);
        $foreign    = $this->issuedPath($otherVideo);
        $before     = $video->fresh()->getAttributes();

        foreach ([$foreign, 'thumbnails/videos/inventada.jpg', self::OLD_THUMBNAIL] as $path) {
            $this->actingAs($this->adminA, 'clinic')
                ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $path])
                ->assertUnprocessable()
                ->assertJsonPath('message', 'Capa não autorizada para este vídeo.');
        }

        $this->assertEquals($before, $video->fresh()->getAttributes());
    }

    public function test_thumbnail_missing_in_storage_gets_422_and_nothing_changes(): void
    {
        $video = $this->videoOfA(Exercise::REVIEW_APPROVED);
        $path  = $this->issuedPath($video);
        $this->fileService->shouldReceive('fileExists')->with($path)->andReturnFalse();
        $before = $video->fresh()->getAttributes();

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $path])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Capa não encontrada no storage.');

        $this->assertEquals($before, $video->fresh()->getAttributes());
    }

    public function test_missing_thumbnail_path_gets_422_validation_error(): void
    {
        $video = $this->videoOfA(Exercise::REVIEW_PENDING);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('thumbnail_path');
    }

    public function test_pending_video_gets_422_because_it_uses_confirm_upload(): void
    {
        $this->fileService->shouldReceive('fileExists')->andReturnTrue();
        $video = $this->videoOfA(Exercise::REVIEW_PENDING);
        $path  = $this->issuedPath($video);
        $video->update(['status' => Video::STATUS_PENDING]);
        $before = $video->fresh()->getAttributes();

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $path])
            ->assertUnprocessable();

        $this->assertEquals($before, $video->fresh()->getAttributes());
    }

    private function videoOfA(string $reviewStatus): Video
    {
        $video = Video::factory()->create([
            'clinic_id'      => $this->clinicA->id,
            'status'         => Video::STATUS_COMPLETED,
            'thumbnail_path' => self::OLD_THUMBNAIL,
            'thumbnail_url'  => 'https://cdn.invalid/' . self::OLD_THUMBNAIL,
            'metadata'       => [],
        ]);

        $exercise = Exercise::create([
            'name'           => 'CAPA exercicio da clinica A',
            'physio_area_id' => PhysioArea::query()->firstOrCreate(['name' => 'Área da capa'])->id,
            'clinic_id'      => $this->clinicA->id,
            'review_status'  => $reviewStatus,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        return $video;
    }

    private function issuedPath(Video $video): string
    {
        return $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/presigned-thumbnail-replace-request", [
                'filename' => 'capa.jpg', 'mime_type' => 'image/jpeg', 'size' => 1024,
            ])
            ->assertOk()
            ->json('data.path');
    }
}
