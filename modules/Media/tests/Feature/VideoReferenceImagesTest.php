<?php

namespace Modules\Media\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\ExerciseMedia;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Models\Video;
use Tests\TestCase;

class VideoReferenceImagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_sync_two_reference_images_to_linked_exercises(): void
    {
        $admin = AdminUser::factory()->create();
        $area  = PhysioArea::create(['name' => 'Área Ref']);
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $exercise = Exercise::create([
            'name'           => 'Com vídeo',
            'physio_area_id' => $area->id,
            'created_by'     => $admin->id,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        $paths = [
            'thumbnails/videos/ref-1.jpeg',
            'thumbnails/videos/ref-2.png',
        ];

        $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => $paths,
            ])
            ->assertOk()
            ->assertJsonPath('data.metadata.reference_images.0.file_path', $paths[0]);

        $this->assertSame(2, ExerciseMedia::query()->where('exercise_id', $exercise->id)->count());
    }

    public function test_admin_rejects_more_than_two_reference_images(): void
    {
        $admin = AdminUser::factory()->create();
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => ['a.jpg', 'b.jpg', 'c.jpg'],
            ])
            ->assertStatus(422);
    }

    public function test_admin_can_clear_reference_images(): void
    {
        $admin = AdminUser::factory()->create();
        $area  = PhysioArea::create(['name' => 'Área Clear']);
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $exercise = Exercise::create([
            'name'           => 'Limpar mídia',
            'physio_area_id' => $area->id,
            'created_by'     => $admin->id,
            'is_active'      => true,
        ]);
        $exercise->videos()->attach($video->id);

        ExerciseMedia::create([
            'exercise_id'       => $exercise->id,
            'type'              => ExerciseMedia::TYPE_IMAGE,
            'file_path'         => 'old.jpg',
            'cdn_url'           => 'https://cdn.example.com/old.jpg',
            'original_filename' => 'old.jpg',
            'mime_type'         => 'image/jpeg',
            'size'              => 1,
            'sort_order'        => 0,
        ]);

        $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => [],
            ])
            ->assertOk();

        $this->assertSame(0, ExerciseMedia::query()->where('exercise_id', $exercise->id)->count());
    }

    public function test_clinic_user_can_sync_reference_images_to_own_exercise(): void
    {
        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        $area  = PhysioArea::create(['name' => 'Área Clínica Ref']);
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $exercise = Exercise::create([
            'name'                         => 'Envio clínica',
            'physio_area_id'               => $area->id,
            'clinic_id'                    => $clinic->id,
            'submitted_by_clinic_user_id'  => $user->id,
            'review_status'                => Exercise::REVIEW_PENDING,
            'is_active'                    => true,
        ]);
        $exercise->videos()->attach($video->id);

        $paths = [
            'thumbnails/videos/clinic-ref-1.jpeg',
            'thumbnails/videos/clinic-ref-2.png',
        ];

        $this->actingAs($user, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => $paths,
            ])
            ->assertOk()
            ->assertJsonPath('data.metadata.reference_images.0.file_path', $paths[0]);

        $this->assertSame(2, ExerciseMedia::query()->where('exercise_id', $exercise->id)->count());
    }
}
