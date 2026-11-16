<?php

namespace Modules\Media\Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Modules\Admin\Models\Exercise;
use Modules\Admin\Models\ExerciseMedia;
use Modules\Admin\Models\PhysioArea;
use Modules\Admin\Models\User as AdminUser;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Media\Events\VideoReferenceImagesChanged;
use Modules\Media\Models\Video;
use Modules\Media\Repositories\VideoRepository;
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

    public function test_the_operator_change_reads_the_video_locked_inside_a_transaction(): void
    {
        $admin = AdminUser::factory()->create();
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);
        $spy   = new class(new Video) extends VideoRepository
        {
            /** @var list<array{id: int, transaction_level: int}> */
            public array $lockedReads = [];

            public function findForUpdate(int $id): Video
            {
                $this->lockedReads[] = ['id' => $id, 'transaction_level' => DB::transactionLevel()];

                return parent::findForUpdate($id);
            }
        };
        $this->app->instance(VideoRepository::class, $spy);
        $levelBefore = DB::transactionLevel();

        $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => ['thumbnails/videos/ref-1.jpeg'],
            ])
            ->assertOk();

        $this->assertNotEmpty($spy->lockedReads);
        $this->assertSame($video->id, $spy->lockedReads[0]['id']);
        $this->assertGreaterThan($levelBefore, $spy->lockedReads[0]['transaction_level']);
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
        $paths = [
            'thumbnails/videos/clinic-ref-1.jpeg',
            'thumbnails/videos/clinic-ref-2.png',
        ];
        $video = Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => ['issued_image_paths' => $paths],
        ]);

        $exercise = Exercise::create([
            'name'                         => 'Envio clínica',
            'physio_area_id'               => $area->id,
            'clinic_id'                    => $clinic->id,
            'submitted_by_clinic_user_id'  => $user->id,
            'review_status'                => Exercise::REVIEW_PENDING,
            'is_active'                    => true,
        ]);
        $exercise->videos()->attach($video->id);

        $this->actingAs($user, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => $paths,
            ])
            ->assertOk()
            ->assertJsonPath('data.metadata.reference_images.0.file_path', $paths[0]);

        $this->assertSame(2, ExerciseMedia::query()->where('exercise_id', $exercise->id)->count());
    }

    public function test_clinic_reference_images_publish_event_with_owner_clinic_and_images(): void
    {
        Event::fake([VideoReferenceImagesChanged::class]);

        $clinic = Clinic::factory()->create();
        $user   = ClinicUser::factory()->create([
            'clinic_id' => $clinic->id,
            'role'      => ClinicUser::ROLE_ADMIN,
        ]);
        $paths = ['thumbnails/videos/evento-1.jpeg', 'thumbnails/videos/evento-2.png'];
        $video = Video::factory()->create([
            'clinic_id' => $clinic->id,
            'status'    => Video::STATUS_COMPLETED,
            'metadata'  => ['issued_image_paths' => $paths],
        ]);

        $this->actingAs($user, 'clinic')
            ->putJson("/api/clinic/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => $paths,
            ])
            ->assertOk();

        Event::assertDispatchedTimes(VideoReferenceImagesChanged::class, 1);
        Event::assertDispatched(VideoReferenceImagesChanged::class, fn (VideoReferenceImagesChanged $event) => $event->videoId === $video->id
            && $event->ownerClinicId === $clinic->id
            && $event->changedByOperator === false
            && array_column($event->images, 'file_path') === $paths);
    }

    public function test_operator_reference_images_publish_event_marked_as_operator(): void
    {
        Event::fake([VideoReferenceImagesChanged::class]);

        $admin = AdminUser::factory()->create();
        $video = Video::factory()->create(['status' => Video::STATUS_COMPLETED]);

        $this->actingAs($admin, 'admin')
            ->putJson("/api/admin/media/videos/{$video->id}/reference-images", [
                'reference_image_paths' => ['thumbnails/videos/catalogo-1.jpeg'],
            ])
            ->assertOk();

        Event::assertDispatched(VideoReferenceImagesChanged::class, fn (VideoReferenceImagesChanged $event) => $event->videoId === $video->id
            && is_null($event->ownerClinicId)
            && $event->changedByOperator === true);
    }
}
