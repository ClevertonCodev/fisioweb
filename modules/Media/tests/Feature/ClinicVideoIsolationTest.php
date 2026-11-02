<?php

namespace Modules\Media\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Cloudflare\Contracts\FileServiceInterface;
use Tests\TestCase;

class ClinicVideoIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $fileService = Mockery::mock(FileServiceInterface::class);
        $fileService->shouldReceive('createPresignedUploadUrl')->andReturnUsing(fn (string $path) => [
            'upload_url' => 'https://r2.example.com/presigned/' . $path,
            'path'       => $path,
            'expires_at' => now()->addMinutes(15)->toISOString(),
        ]);
        $fileService->shouldReceive('fileExists')->andReturnTrue();
        $fileService->shouldReceive('getFileUrl')->andReturn('https://r2.example.com/videos/test.mp4');
        $fileService->shouldReceive('getFileCdnUrl')->andReturn('https://cdn.example.com/videos/test.mp4');
        $fileService->shouldReceive('deleteFile')->andReturnTrue();
        $this->app->instance(FileServiceInterface::class, $fileService);
    }

    private function clinicAdmin(?Clinic $clinic = null): ClinicUser
    {
        return ClinicUser::factory()->create([
            'clinic_id' => ($clinic ?? Clinic::factory()->create())->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
    }

    public function test_presigned_upload_rejects_video_above_20mb(): void
    {
        $clinicAdmin = $this->clinicAdmin();
        $admin       = AdminUser::factory()->create();

        $payload = [
            'filename'  => 'grande.mp4',
            'mime_type' => 'video/mp4',
            'size'      => 20971520 + 1,
        ];

        $this->actingAs($clinicAdmin, 'clinic')
            ->postJson('/api/clinic/media/videos/presigned-upload-request', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['size']);

        $this->actingAs($admin, 'admin')
            ->postJson('/api/admin/media/videos/presigned-upload-request', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['size']);
    }

    public function test_clinic_presigned_upload_records_clinic_id_and_requires_clinic_admin(): void
    {
        $clinic = Clinic::factory()->create();
        $admin  = $this->clinicAdmin($clinic);
        $physio = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_PHYSIOTHERAPIST,
        ]);

        $payload = [
            'filename'  => 'ponte.mp4',
            'mime_type' => 'video/mp4',
            'size'      => 5 * 1024 * 1024,
        ];

        $this->actingAs($physio, 'clinic')
            ->postJson('/api/clinic/media/videos/presigned-upload-request', $payload)
            ->assertForbidden();

        $response = $this->actingAs($admin, 'clinic')
            ->postJson('/api/clinic/media/videos/presigned-upload-request', $payload)
            ->assertOk();

        $videoId = $response->json('data.video_id');
        $this->assertNotNull($videoId);
        $this->assertDatabaseHas('media_videos', [
            'id'        => $videoId,
            'clinic_id' => $clinic->id,
        ]);
    }

    public function test_removed_clinic_video_routes_return_404(): void
    {
        $clinic = Clinic::factory()->create();
        $admin  = $this->clinicAdmin($clinic);
        $video  = \Modules\Media\Models\Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => \Modules\Media\Models\Video::STATUS_COMPLETED,
        ]);

        $this->actingAs($admin, 'clinic')
            ->getJson('/api/clinic/media/videos')
            ->assertNotFound();

        $this->actingAs($admin, 'clinic')
            ->getJson("/api/clinic/media/videos/{$video->id}")
            ->assertNotFound();

        $this->actingAs($admin, 'clinic')
            ->patchJson("/api/clinic/media/videos/{$video->id}", ['duration' => 30])
            ->assertNotFound();

        $this->actingAs($admin, 'clinic')
            ->deleteJson("/api/clinic/media/videos/{$video->id}")
            ->assertNotFound();

        $this->assertDatabaseHas('media_videos', ['id' => $video->id, 'deleted_at' => null]);
    }

    public function test_clinic_cannot_modify_video_of_other_clinic_or_catalog(): void
    {
        $clinicA     = Clinic::factory()->create();
        $clinicB     = Clinic::factory()->create();
        $adminB      = $this->clinicAdmin($clinicB);
        $videoOfA    = \Modules\Media\Models\Video::factory()->create([
            'clinic_id' => $clinicA->id,
            'status'    => \Modules\Media\Models\Video::STATUS_PENDING,
        ]);
        $catalogVideo = \Modules\Media\Models\Video::factory()->create([
            'clinic_id' => null,
            'status'    => \Modules\Media\Models\Video::STATUS_COMPLETED,
        ]);

        $thumbPayload = [
            'filename'  => 'capa.jpg',
            'mime_type' => 'image/jpeg',
            'size'      => 102400,
        ];

        foreach ([$videoOfA, $catalogVideo] as $target) {
            $this->actingAs($adminB, 'clinic')
                ->postJson("/api/clinic/media/videos/{$target->id}/presigned-thumbnail-request", $thumbPayload)
                ->assertNotFound();

            $this->actingAs($adminB, 'clinic')
                ->postJson("/api/clinic/media/videos/{$target->id}/presigned-thumbnail-replace-request", $thumbPayload)
                ->assertNotFound();

            $this->actingAs($adminB, 'clinic')
                ->postJson("/api/clinic/media/videos/{$target->id}/confirm-upload", ['duration' => 45])
                ->assertNotFound();

            $this->actingAs($adminB, 'clinic')
                ->putJson("/api/clinic/media/videos/{$target->id}/reference-images", [
                    'reference_image_paths' => ['thumbnails/videos/ref-1.jpg'],
                ])
                ->assertNotFound();
        }
    }

    public function test_non_admin_cannot_use_clinic_video_mutation_routes_and_admin_completes_full_flow(): void
    {
        $clinic    = Clinic::factory()->create();
        $admin     = $this->clinicAdmin($clinic);
        $secretary = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_SECRETARY,
        ]);

        $uploadRes = $this->actingAs($admin, 'clinic')
            ->postJson('/api/clinic/media/videos/presigned-upload-request', [
                'filename'  => 'agachamento.mp4',
                'mime_type' => 'video/mp4',
                'size'      => 2 * 1024 * 1024,
            ])
            ->assertOk();

        $videoId = (int) $uploadRes->json('data.video_id');

        $thumbPayload = [
            'filename'  => 'capa.jpg',
            'mime_type' => 'image/jpeg',
            'size'      => 102400,
        ];

        $this->actingAs($secretary, 'clinic')
            ->postJson("/api/clinic/media/videos/{$videoId}/presigned-thumbnail-request", $thumbPayload)
            ->assertForbidden();

        $this->actingAs($secretary, 'clinic')
            ->postJson("/api/clinic/media/videos/{$videoId}/confirm-upload", ['duration' => 30])
            ->assertForbidden();

        $thumbRes = $this->actingAs($admin, 'clinic')
            ->postJson("/api/clinic/media/videos/{$videoId}/presigned-thumbnail-request", $thumbPayload)
            ->assertOk();

        $thumbPath = $thumbRes->json('data.path');

        $this->actingAs($admin, 'clinic')
            ->postJson("/api/clinic/media/videos/{$videoId}/confirm-upload", [
                'thumbnail_path'    => $thumbPath,
                'original_filename' => 'agachamento.mp4',
                'duration'          => 45,
            ])
            ->assertOk()
            ->assertJsonPath('data.status', \Modules\Media\Models\Video::STATUS_COMPLETED)
            ->assertJsonPath('data.duration', 45);

        $this->actingAs($secretary, 'clinic')
            ->postJson("/api/clinic/media/videos/{$videoId}/presigned-thumbnail-replace-request", $thumbPayload)
            ->assertForbidden();

        $this->actingAs($secretary, 'clinic')
            ->putJson("/api/clinic/media/videos/{$videoId}/reference-images", [
                'reference_image_paths' => ['thumbnails/videos/ref-1.jpg'],
            ])
            ->assertForbidden();

        $refRes = $this->actingAs($admin, 'clinic')
            ->postJson("/api/clinic/media/videos/{$videoId}/presigned-thumbnail-replace-request", $thumbPayload)
            ->assertOk();

        $this->actingAs($admin, 'clinic')
            ->putJson("/api/clinic/media/videos/{$videoId}/reference-images", [
                'reference_image_paths' => [$refRes->json('data.path')],
            ])
            ->assertOk();
    }
}
