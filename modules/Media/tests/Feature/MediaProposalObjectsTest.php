<?php

namespace Modules\Media\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\PhysioArea;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Modules\Media\Models\Video;
use Tests\TestCase;

class MediaProposalObjectsTest extends TestCase
{
    use RefreshDatabase;

    private const CURRENT_IMAGE = 'thumbnails/videos/foto-aprovada.jpg';

    private const OLD_PROPOSED_THUMBNAIL = 'thumbnails/videos/capa-proposta-antiga.jpg';

    private const OLD_PROPOSED_IMAGE = 'thumbnails/videos/foto-proposta-antiga.jpg';

    private Clinic $clinicA;

    private ClinicUser $adminA;

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
        $fileService->shouldReceive('getFileCdnUrl')->andReturnUsing(fn (string $path) => 'https://cdn.invalid/' . $path);
        $fileService->shouldReceive('getFileUrl')->andReturnUsing(fn (string $path) => 'https://r2.invalid/' . $path);
        $fileService->shouldReceive('deleteFile')->andReturnUsing(function (string $path) {
            $this->deletedPaths[] = $path;

            return true;
        });
        $this->app->instance(FileServiceInterface::class, $fileService);

        $this->clinicA = Clinic::factory()->create();
        $this->adminA  = ClinicUser::factory()->create(['clinic_id' => $this->clinicA->id, 'role' => ClinicUser::ROLE_ADMIN]);
    }

    public function test_change_on_a_video_that_is_free_again_discards_the_old_proposal_and_its_objects(): void
    {
        $video    = $this->videoOfA();
        $approved = $this->linkedExercise($video, Exercise::REVIEW_APPROVED);
        $this->linkedExercise($video, Exercise::REVIEW_PENDING);
        $oldThumbnail = $this->proposeThumbnail($video);
        $oldImage     = $this->proposeImages($video, [$this->issuedPath($video)])[0];

        $approved->videos()->detach($video->id);
        $newImage = $this->issuedPath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => [$newImage]])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', false)
            ->assertJsonPath('data.metadata.reference_images.0.file_path', $newImage);

        $metadata = $video->fresh()->metadata;
        $this->assertSame([], array_intersect_key($metadata, array_flip(Video::MEDIA_PROPOSAL_KEYS)));
        $this->assertEqualsCanonicalizing([$oldThumbnail, $oldImage], $this->deletedPaths);
    }

    public function test_thumbnail_change_on_a_video_that_is_free_again_discards_the_old_proposal(): void
    {
        $video    = $this->videoOfA();
        $approved = $this->linkedExercise($video, Exercise::REVIEW_APPROVED);
        $oldImage = $this->proposeImages($video, [$this->issuedPath($video)])[0];

        $approved->videos()->detach($video->id);
        $newThumbnail = $this->issuedPath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $newThumbnail])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', false)
            ->assertJsonPath('data.thumbnail_url', 'https://cdn.invalid/' . $newThumbnail);

        $video = $video->fresh();
        $this->assertSame([], array_intersect_key($video->metadata, array_flip(Video::MEDIA_PROPOSAL_KEYS)));
        $this->assertSame([self::CURRENT_IMAGE], array_column($video->metadata['reference_images'], 'file_path'));
        $this->assertSame([$oldImage], $this->deletedPaths);
    }

    public function test_new_proposal_deletes_only_the_replaced_proposed_objects(): void
    {
        $video = $this->videoOfA();
        $this->linkedExercise($video, Exercise::REVIEW_APPROVED);

        $firstThumbnail  = $this->proposeThumbnail($video);
        $firstImage      = $this->proposeImages($video, [$this->issuedPath($video), self::CURRENT_IMAGE])[0];
        $this->assertSame([], $this->deletedPaths);

        $secondThumbnail = $this->proposeThumbnail($video);
        $this->assertSame([$firstThumbnail], $this->deletedPaths);

        $secondImage = $this->proposeImages($video, [$this->issuedPath($video), self::CURRENT_IMAGE])[0];
        $this->assertSame([$firstThumbnail, $firstImage], $this->deletedPaths);

        $metadata = $video->fresh()->metadata;
        $this->assertSame($secondThumbnail, $metadata['proposed_thumbnail_path']);
        $this->assertSame([$secondImage, self::CURRENT_IMAGE], array_column($metadata['proposed_reference_images'], 'file_path'));
        $this->assertSame([self::CURRENT_IMAGE], array_column($metadata['reference_images'], 'file_path'));
    }

    public function test_confirm_upload_on_a_free_video_discards_the_old_proposal_and_its_objects(): void
    {
        $video = $this->pendingVideoWithOldProposal();
        $this->linkedExercise($video, Exercise::REVIEW_PENDING);
        $thumbnail = $this->pendingThumbnailPath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/confirm-upload", ['thumbnail_path' => $thumbnail])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', false)
            ->assertJsonPath('data.thumbnail_url', 'https://cdn.invalid/' . $thumbnail);

        $video = $video->fresh();
        $this->assertSame($thumbnail, $video->thumbnail_path);
        $this->assertSame([], array_intersect_key($video->metadata, array_flip(Video::MEDIA_PROPOSAL_KEYS)));
        $this->assertEqualsCanonicalizing([self::OLD_PROPOSED_THUMBNAIL, self::OLD_PROPOSED_IMAGE], $this->deletedPaths);
    }

    public function test_confirm_upload_on_a_locked_video_deletes_only_the_replaced_proposed_thumbnail(): void
    {
        $video = $this->pendingVideoWithOldProposal();
        $this->linkedExercise($video, Exercise::REVIEW_APPROVED);
        $thumbnail = $this->pendingThumbnailPath($video);

        $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/confirm-upload", ['thumbnail_path' => $thumbnail])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true)
            ->assertJsonPath('data.thumbnail_url', null);

        $metadata = $video->fresh()->metadata;
        $this->assertSame($thumbnail, $metadata['proposed_thumbnail_path']);
        $this->assertSame([self::OLD_PROPOSED_IMAGE], array_column($metadata['proposed_reference_images'], 'file_path'));
        $this->assertSame([self::OLD_PROPOSED_THUMBNAIL], $this->deletedPaths);
    }

    private function pendingVideoWithOldProposal(): Video
    {
        return Video::factory()->create([
            'clinic_id'      => $this->clinicA->id,
            'status'         => Video::STATUS_PENDING,
            'thumbnail_path' => null,
            'thumbnail_url'  => null,
            'metadata'       => [
                'proposed_thumbnail_path'    => self::OLD_PROPOSED_THUMBNAIL,
                'proposed_reference_images'  => [[
                    'file_path'         => self::OLD_PROPOSED_IMAGE,
                    'cdn_url'           => 'https://cdn.invalid/' . self::OLD_PROPOSED_IMAGE,
                    'original_filename' => basename(self::OLD_PROPOSED_IMAGE),
                    'mime_type'         => 'image/jpeg',
                    'size'              => 0,
                ]],
                'proposed_at'                => now()->subDay()->toIso8601String(),
                'proposed_by_clinic_user_id' => $this->adminA->id,
            ],
        ]);
    }

    private function pendingThumbnailPath(Video $video): string
    {
        return $this->actingAs($this->adminA, 'clinic')
            ->postJson("/api/clinic/media/videos/{$video->id}/presigned-thumbnail-request", [
                'filename' => 'capa.jpg', 'mime_type' => 'image/jpeg', 'size' => 1024,
            ])
            ->assertOk()
            ->json('data.path');
    }

    private function proposeThumbnail(Video $video): string
    {
        $path = $this->issuedPath($video);
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/thumbnail", ['thumbnail_path' => $path])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true);

        return $path;
    }

    /**
     * @param  list<string>  $paths
     * @return list<string>
     */
    private function proposeImages(Video $video, array $paths): array
    {
        $this->actingAs($this->adminA, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", ['reference_image_paths' => $paths])
            ->assertOk()
            ->assertJsonPath('data.proposal_pending', true);

        return $paths;
    }

    private function videoOfA(): Video
    {
        return Video::factory()->create([
            'clinic_id'      => $this->clinicA->id,
            'status'         => Video::STATUS_COMPLETED,
            'thumbnail_path' => 'thumbnails/videos/capa-aprovada.jpg',
            'thumbnail_url'  => 'https://cdn.invalid/thumbnails/videos/capa-aprovada.jpg',
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

    private function linkedExercise(Video $video, string $reviewStatus): Exercise
    {
        $exercise = Exercise::create([
            'name'           => 'Ligado ' . $reviewStatus,
            'physio_area_id' => PhysioArea::query()->firstOrCreate(['name' => 'Área ligada'])->id,
            'clinic_id'      => $this->clinicA->id,
            'review_status'  => $reviewStatus,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        return $exercise;
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
